// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./AccessControlBase.sol";
import "./BitMath64.sol";
import "./OnChainClashInterface.sol";

contract OnChainClash is IOnChainClash, AccessControlBase, ReentrancyGuard {
    using BitMath64 for uint;
    using SafeERC20 for IERC20;

    uint public constant m_land = 0;
    uint public constant m_sea = 1;
    uint public constant m_f1 = 1;
    uint public constant m_f2 = 2;
    uint public constant m_f3 = 3;

    struct ClaimedReward {
        uint time;
        address token;
        uint amount;
    }

    struct Position {
        uint row;
        uint col;
    }

    struct GameParse {
        IOnChainClashRule rule;
        uint createdAt;
        uint finishAt;
        uint startAt;
        uint finishedAt;
        uint reward; // total amount 
        uint winFaction;
        uint cellsFaction1;
        uint cellsFaction2;
        uint cellsFaction3;
        uint countCell;
        uint payAmountFaction1;
        uint payAmountFaction2;
        uint payAmountFaction3;
        uint[] mapData;
    }

    uint public shareRevenueToOwner = 100; // 10% = 100 / 1000
    uint public shareRevenueToPool = 0; //0% = 0 / 1000: Total share to nft owner and ref or marketing
    address public poolAddress = address(0x0);

    Game[] public games;
    mapping (uint => uint[]) mapData; // gameId => mapData

    mapping (uint => uint) public cells; // [0, col, row, gameId] => [latest time, total PayAmount, height, current price]
    mapping (uint => mapping(address => uint[3])) public playerPayAmounts; // gameId => player => [0, amountF3, amountF2, amountF1]
    mapping (uint => mapping(address => ClaimedReward)) public claimedReward; // gameId => address => amount

    event FillFaction(uint gameId, address player, uint rowStart, uint colStart, uint faction, uint countFill, uint[] maskBound, address payToken, uint amount);
    event BuyACell(uint gameId, address player, uint faction, uint row, uint col, address payToken, uint amount);
    event ClaimReward(uint gameId, address player, address payToken, uint amount);
    event NewGame(uint gameId, uint startAt, uint finishAt, uint initReward);
    event FinishGame(uint gameId, uint winFaction, uint totalReward);
    event Refund(address player, uint gameId, uint amount);

    modifier validateGameId(uint _gameId) {
        require(_gameId < games.length, "OnChainClash: Wrong gameId");
        _;
    }

    modifier validateFaction(uint faction) {
        require(faction == m_f1 || faction == m_f2 || faction == m_f3, "OnChainClash: Wrong faction");
        _;
    }

    modifier gameInTime(uint _gameId) {
        require(games[_gameId].time.v2() <= block.timestamp, "OnChainClash: This game have not begin");
        require(games[_gameId].time.v3() > block.timestamp, "OnChainClash: This game has been finished");
        _;
    }

    modifier gameCanFinish(uint _gameId) {
        require(
            games[_gameId].time.v3() < block.timestamp
            && games[_gameId].time.v4() == 0 
            && games[_gameId].time.v3() + 7 days > block.timestamp, "OnChainClash: Cannot finish game");
        _;
    }

    modifier gameFinished(uint _gameId) {
        require(games[_gameId].time.v4() > 0, "OnChainClash: Not Finished");
        _;
    }

    modifier gameRefund(uint _gameId) {
        require(games[_gameId].time.v4() == 0 && games[_gameId].time.v3() + 7 days < block.timestamp, "OnChainClash: Cannot claim");
        _;
    }

    function getBlockTimestamp() public view returns (uint) {
        return block.timestamp;
    }

    function numberOfGame() public view returns (uint) {
        return games.length;
    }

    function getGame(uint _gameId) public view returns (Game memory) {
        return games[_gameId];
    }

    function getGameInfo(uint _gameId) public view returns (GameParse memory result) {
        Game memory game = games[_gameId];

        result.rule = game.rule;
        result.createdAt = game.time.v1();
        result.startAt = game.time.v2();
        result.finishAt = game.time.v3();
        result.finishedAt = game.time.v4();
        result.reward = game.reward;
        result.winFaction = game.winFaction;
        result.cellsFaction1 = game.cells.v1();
        result.cellsFaction2 = game.cells.v2();
        result.cellsFaction3 = game.cells.v3();
        result.countCell = game.cells.v4();
        result.payAmountFaction1 = game.payAmounts[0];
        result.payAmountFaction2 = game.payAmounts[1];
        result.payAmountFaction3 = game.payAmounts[2];
        result.mapData = mapData[_gameId];
    }

    function getPlayerPayInfo(address _player, uint[] memory _gameIds) public view returns (uint[3][] memory result) {
        result = new uint[3][](_gameIds.length);

        for (uint i = 0; i < _gameIds.length; i++) {
            result[i] = playerPayAmounts[_gameIds[i]][_player];
        }
    }

    function getMapData(uint _gameId) public view returns (uint[] memory) {
        return mapData[_gameId];
    }

    function getBoughtCells(uint _gameId) public view returns (uint f1, uint f2, uint f3, uint total) {
        uint t = games[_gameId].countBoughtCells;
        f1 = t.v1();
        f2 = t.v2();
        f3 = t.v3();
        total = t.v4();
    }

    function getCell(uint _gameId, uint _row, uint _col) public view returns (uint cellType, uint faction, uint height, uint price, uint priceOriginal, uint latestTime) {
        uint tmpId = _gameId.merge(_col, _row);
        uint row = mapData[_gameId][_row];
        uint cellInfo = cells[tmpId];

        cellType = row.bit4(_col) ? m_sea : m_land;
        faction = row.bitOf_1_2_3(_col);

        price = cellInfo.v1() * 10 ** 8;
        priceOriginal = cellInfo.v3() * 10 ** 8;
        latestTime = cellInfo.v4();

        height = cellInfo.v2();

        if (height == 0 && row.hasBit_in_1_2_3(_col)) {
            height = 1;
            price = games[_gameId].rule.getFillPrice();
            priceOriginal = games[_gameId].rule.getFillPrice();
        }
    }

    function setPoolAddress(address _poolAddress) public onlyOwner {
        poolAddress = _poolAddress;
    }

    function setShareRevenue(uint _shareToOwner, uint _shareToPool) public onlyOwner {
        shareRevenueToOwner = _shareToOwner;
        shareRevenueToPool = _shareToPool;
    }

    function newGame(
        address _rule, 
        uint _reward,
        uint _startAt, 
        uint _finishAt, 
        uint[] memory _mapInitData,
        Position[] memory _faction1,
        Position[] memory _faction2,
        Position[] memory _faction3
    ) public payable onlyOperator nonReentrant {
        require(_mapInitData.length == 64, "OnChainClash: Wrong map");
        require(_finishAt > block.timestamp, "OnChainClash: FinishTime is invalid");
        require(_startAt < _finishAt, "OnChainClash: Wrong start and finish time");

        uint gameId = games.length;
        Game memory game = Game({
            rule: IOnChainClashRule(_rule),
            time: uint(0).c256(0, _finishAt, _startAt, block.timestamp), // created At, start, finish, finished
            reward: _reward,
            winFaction: 0,
            countBoughtCells: uint(0).c256(0, 0, 0, 0),
            cells: uint(0).c256(0, 0, 0, 0),
            payAmounts: [uint(0), uint(0), uint(0)]
        });

        if (_reward > 0) {
            processPayment(game.rule.payToken(), msg.sender, _reward);
        }

        mapData[gameId] = _mapInitData;
        games.push(game);
        
        for (uint i = 0; i < _faction1.length; i++) {
            newCell(gameId, _faction1[i].row, _faction1[i].col, m_f1, 0, 0);
            emit BuyACell(gameId, address(0x0), m_f1, _faction1[i].row, _faction1[i].col, game.rule.payToken(), 0);
        }

        for (uint i = 0; i < _faction2.length; i++) {
            newCell(gameId, _faction2[i].row, _faction2[i].col, m_f2, 0, 0);
            emit BuyACell(gameId, address(0x0), m_f2, _faction2[i].row, _faction2[i].col, game.rule.payToken(), 0);
        }

        for (uint i = 0; i < _faction3.length; i++) {
            newCell(gameId, _faction3[i].row, _faction3[i].col, m_f3, 0, 0);
            emit BuyACell(gameId, address(0x0), m_f3, _faction3[i].row, _faction3[i].col, game.rule.payToken(), 0);
        }

        emit NewGame(gameId, _startAt, _finishAt, _reward);
    }

    function processPayment(address payToken, address from, uint amount) private {
        if (payToken == address(0x0)) {
            require(msg.value >= amount, "OnChainClash: Wrong pay amount");
            if (msg.value > amount) {
                transfer(payToken, from, msg.value - amount);
            }
        }
        else {
            IERC20(payToken).safeTransferFrom(from, address(this), amount);
        }
    }

    function transfer(address payToken, address _to, uint _amount) private {
        if (payToken == address(0x0)) {
            payable(_to).transfer(_amount);
        }
        else {
            IERC20(payToken).transfer(_to, _amount);
        }
    }

    function newCell(uint _gameId, uint _row, uint _col, uint _faction, uint _payAmount, uint _payAmountOriginal) private {
        uint tmpId = _gameId.merge(_col, _row);

        uint rowValue = mapData[_gameId][_row];

        uint height = cells[tmpId].v2();

        if (height == 0 && rowValue.hasBit_in_1_2_3(_col)) {
            height = 1;
        }

        mapData[_gameId][_row] = rowValue.gameOnBit(_faction, _col);

        cells[tmpId] = cells[tmpId]
            .set1(_payAmount / (10 ** 8))
            .set2(height + 1)
            .set3(_payAmountOriginal / (10 ** 8))
            .set4(block.timestamp);
        games[_gameId].payAmounts[_faction - 1] += _payAmount;

    }

    function requireGameInput(uint _gameId, uint _row, uint _col, uint _faction) public view 
        validateGameId(_gameId) 
        validateFaction(_faction)
        gameInTime(_gameId) {
        require(0 <= _row && _row < 64, "OnChainClash: Wrong row");
        require(0 <= _col && _col < 64, "OnChainClash: Wrong row");
    }

    function buyCell(
        uint _gameId, 
        uint _row, 
        uint _col, 
        uint _faction,
        Proof[] memory _proofs
    ) public payable 
        nonReentrant
    {
        requireGameInput(_gameId, _row, _col, _faction);
        address player = msg.sender;
        Game memory game = games[_gameId];

        require(
            game.rule.validateNewCell(
                _row > 0 ? mapData[_gameId][_row - 1] : 0,
                mapData[_gameId][_row],
                _row < game.rule.rows() - 1 ? mapData[_gameId][_row + 1] : 0,
                _col,
                _faction
            ), 
            "OnChainClash: Invalid position"
        );

        require(verifyProof(
            abi.encodePacked(player, _gameId, _row, _col, _faction),
            _proofs
        ), "OnChainClash: Wrong proof");

        (address payToken, uint payAmount, uint payAmountOriginal) = game.rule.getPayAmount(this, _gameId, _row, _col, _faction);

        processPayment(payToken, player, payAmount);
        playerPayAmounts[_gameId][player][_faction - 1] += payAmount;

        newCell(_gameId, _row, _col, _faction, payAmount, payAmountOriginal);
        games[_gameId].countBoughtCells = (
              _faction == m_f1 ? game.countBoughtCells.add1(1).add4(1)
            : _faction == m_f2 ?game.countBoughtCells.add2(1).add4(1)
            : _faction == m_f3 ? game.countBoughtCells.add3(1).add4(1) 
            : game.countBoughtCells
        );
        emit BuyACell(_gameId, msg.sender, _faction, _row, _col, payToken, payAmount);
    }

    /*
       1  2  3
        \ | /
      8 -   - 4
        / | \  
       7  6  5
    */
    function fillFaction(
        uint _gameId,
        uint _rowStart,
        uint _colStart, 
        uint _faction,
        uint _maxCellFill,
        uint[] memory _maskBound,
        Proof[] memory _proofs
    ) public payable
        nonReentrant
    {    
        
        requireGameInput(_gameId, _rowStart, _colStart, _faction);
        if (_maskBound.length > 0) {
            require(
                games[_gameId].rule.verifyBound(mapData[_gameId], _maskBound, _faction),
                "OnChainClash: Wrong bound"
            );
        }
        require(!mapData[_gameId][_rowStart].bit(_faction, _colStart), "OnChainClash: Wrong position");

        require(verifyProof(
            abi.encodePacked(msg.sender, _gameId, _rowStart, _colStart, _faction),
            _proofs
        ), "OnChainClash: Wrong proof");
        
        (address payToken, uint payAmount,) = games[_gameId].rule.getPayAmountForFill(this, _gameId, _rowStart, _colStart, _faction);

        processPayment(payToken, msg.sender, payAmount);

        playerPayAmounts[_gameId][msg.sender][_faction - 1] += payAmount;
        games[_gameId].payAmounts[_faction - 1] += payAmount;
        
        uint countFill = 0;
        (mapData[_gameId], countFill) = games[_gameId].rule.fill(mapData[_gameId], _rowStart, _colStart, _faction, _maxCellFill);
        
        games[_gameId].countBoughtCells = (
              _faction == m_f1 ? games[_gameId].countBoughtCells.add1(1).add4(1)
            : _faction == m_f2 ?games[_gameId].countBoughtCells.add2(1).add4(1)
            : _faction == m_f3 ? games[_gameId].countBoughtCells.add3(1).add4(1) 
            : games[_gameId].countBoughtCells
        );

        emit FillFaction(_gameId, msg.sender, _rowStart, _colStart, _faction, countFill, _maskBound, payToken, payAmount);
    }

    function winFaction(uint cellFaction0, uint cellFaction1, uint cellFaction2) public view returns (uint) {
        uint advantageFaction = uint(blockhash(block.number - 1)) % 3 + 1;
        if (cellFaction0 > cellFaction1 && cellFaction0 > cellFaction2) {
            return m_f1;
        }
        if (cellFaction1 > cellFaction0 && cellFaction1 > cellFaction2) {
            return m_f2;
        }
        if (cellFaction2 > cellFaction0 && cellFaction2 > cellFaction1) {
            return m_f3;
        }

        if (cellFaction0 == cellFaction1 && cellFaction0 > cellFaction2) {
            if (advantageFaction == m_f1) return m_f1;
            if (advantageFaction == m_f1) return m_f1;
            return m_f1;
        }
        if (cellFaction0 == cellFaction2 && cellFaction0 > cellFaction1) {
            if (advantageFaction == m_f1) return m_f1;
            if (advantageFaction == m_f3) return m_f3;
            return m_f1;
        }
        if (cellFaction1 == cellFaction2 && cellFaction1 > cellFaction0) {
            if (advantageFaction == m_f2) return m_f2;
            if (advantageFaction == m_f3) return m_f3;
            return m_f2;
        }

        if (cellFaction0 == cellFaction1 && cellFaction1 == cellFaction2) {
            if (advantageFaction == m_f1) return m_f1;
            if (advantageFaction == m_f2) return m_f2;
            if (advantageFaction == m_f3) return m_f3;
            return m_f1;
        }

        return m_f1;
    }

    function countCells(
        uint _gameId,
        uint _tryCountNumberOfCells
    ) public 
        validateGameId(_gameId) 
        gameCanFinish(_gameId) 
        onlyOperator 
        nonReentrant
    {
        Game memory game = games[_gameId];
        require(game.winFaction == 0, "OnChainClash: Cannot call finish game");

        uint ROWS = game.rule.rows();
        uint COLS = game.rule.cols();

        uint countCell = game.cells.v4();
        _tryCountNumberOfCells += countCell;

        _tryCountNumberOfCells = _tryCountNumberOfCells > ROWS * COLS ? ROWS * COLS : _tryCountNumberOfCells;

        for (; countCell < _tryCountNumberOfCells; countCell++) {
            uint row = countCell / ROWS;
            uint col = countCell % COLS;

            uint faction = mapData[_gameId][row].bitOf_1_2_3(col);
            game.cells = game.cells.add(faction, 1);
        }

        games[_gameId].cells = game.cells.set4(countCell);
    }

    function finishGame(
        uint _gameId
    ) public 
        validateGameId(_gameId) 
        gameCanFinish(_gameId)
        onlyOperator 
        nonReentrant
    {
        Game memory game = games[_gameId];
        require(game.winFaction == 0, "OnChainClash: Cannot call finish game");

        require(game.cells.v4() == game.rule.rows() * game.rule.cols(), "OnChainClash: Try count cells before finish");
        
        uint totalPayAmount = game.payAmounts[0] + game.payAmounts[1] + game.payAmounts[2];
        uint ownerAmount = totalPayAmount * shareRevenueToOwner / 1000;
        uint poolAmount = totalPayAmount * shareRevenueToPool / 1000;
        
        games[_gameId].time = game.time.set4(block.timestamp);
        games[_gameId].reward += totalPayAmount - ownerAmount - poolAmount;
        games[_gameId].winFaction = winFaction(game.cells.v1(), game.cells.v2(), game.cells.v3());

        address payToken = IOnChainClashRule(game.rule).payToken();
        if (ownerAmount > 0) {
            transfer(payToken, owner(), ownerAmount);
        }
        if (poolAmount > 0) {
            if (poolAddress == address(0x0)) {
                transfer(payToken, owner(), poolAmount);
            }
            else {
                transfer(payToken, poolAddress, poolAmount);
            }
        }

        emit FinishGame(_gameId, games[_gameId].winFaction, games[_gameId].reward);
    }

    function calculateRewardForPlayer(uint _gameId, address _player) public view returns (uint) {
        Game memory game = games[_gameId];

        uint reward = game.reward;
        uint playerPayAmountForFaction = playerPayAmounts[_gameId][_player][game.winFaction - 1];
        uint totalPayAmount = game.payAmounts[game.winFaction - 1];
        
        uint rewardForPlayer = playerPayAmountForFaction * reward / totalPayAmount;

        return rewardForPlayer;
    }

    function claimReward(uint _gameId) public 
        validateGameId(_gameId) 
        gameFinished(_gameId) 
        nonReentrant
    {
        address payable player = payable(msg.sender);
        Game memory game = games[_gameId];

        require(claimedReward[_gameId][player].amount == 0, "OnChainClash: Claimed");

        uint rewardForPlayer = calculateRewardForPlayer(_gameId, player);

        address payToken = game.rule.payToken();

        claimedReward[_gameId][player] = ClaimedReward({
            time: block.timestamp,
            token: payToken,
            amount: rewardForPlayer
        });

        if (rewardForPlayer > 0) {
            transfer(payToken, player, rewardForPlayer);
        }

        emit ClaimReward(_gameId, player, payToken, rewardForPlayer);
    }

    function claimRewards(uint[] memory _gameIds) public {
        for (uint i = 0; i < _gameIds.length; i++) {
            claimReward(_gameIds[i]);
        }
    }

    function refund(uint _gameId) public gameRefund(_gameId) nonReentrant {
        uint amount = playerPayAmounts[_gameId][msg.sender][0];
        amount += playerPayAmounts[_gameId][msg.sender][1];
        amount += playerPayAmounts[_gameId][msg.sender][2];

        address payToken = games[_gameId].rule.payToken();

        playerPayAmounts[_gameId][msg.sender][0] = 0;
        playerPayAmounts[_gameId][msg.sender][1] = 0;
        playerPayAmounts[_gameId][msg.sender][2] = 0;

        if (amount > 0) {
            transfer(payToken, msg.sender, amount);
        }

        emit Refund(msg.sender, _gameId, amount);
    }
}
