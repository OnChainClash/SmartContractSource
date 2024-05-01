// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "hardhat/console.sol";

import "./AccessControlBase.sol";
import "./BitMath64.sol";
import "./OnChainClashInterface.sol";

contract OnChainClashRuleV1 is IOnChainClashRule {
    using BitMath64 for uint;

    address constant public payToken = address(0x0);

    uint public constant MAX_ROW_INDEX = 63; // 0 to 63 (total 64 rows)
    uint public constant MAX_COL_INDEX = 63; // 0 to 63 (total 63 cols)

    uint public constant m_f1 = 1;
    uint public constant m_f2 = 2;
    uint public constant m_f3 = 3;
    uint public constant m_land = 0;
    uint public constant m_sea = 1;

    uint public constant same_faction_ratio = 120; // 120/100  = 1.2
    uint public constant neutral_faction_ratio = 140; // 140 / 100  = 1.4
    uint public constant dif_faction_ratio = 160; // 160 / 100  = 1.6

    uint public constant same_faction_startPrice = 0.001 ether;
    uint public constant neutral_faction_startPrice = 0.001 * 1.4 ether;
    uint public constant dif_faction_startPrice = 0.001 * 3 ether;

    uint public constant fill_price = 0.001 ether;

    function rows() public pure returns (uint) {
        return MAX_ROW_INDEX + 1;
    }

    function cols() public pure returns (uint) {
        return MAX_COL_INDEX + 1;
    }

    function getFillPrice() public pure returns (uint) {
        return fill_price;
    }

    function calculatePayAmount(uint _prePrice, uint _cellType, uint _faction) public pure returns (uint) {
        if (
            (_faction == m_f1 && _cellType == m_land) 
         || (_faction == m_f3 && _cellType == m_sea)
        ) {
            return _prePrice == 0 ? same_faction_startPrice
            : _prePrice * same_faction_ratio / 100;
        }
        else if (
            (_faction == m_f1 && _cellType == m_sea) 
         || (_faction == m_f3 && _cellType == m_land)
        ) {
            return _prePrice == 0 ? dif_faction_startPrice 
                : _prePrice * dif_faction_ratio / 100;
        }

        return _prePrice == 0 ? neutral_faction_startPrice 
            : _prePrice * neutral_faction_ratio / 100;
    }

    function getPayAmount(IOnChainClash _clash, uint _gameId, uint _row, uint _col, uint _faction) public view returns (address _payToken, uint _price, uint _priceOriginal) {
        _payToken = payToken;
        (uint cellType,,, uint price, uint priceOriginal,) = _clash.getCell(_gameId, _row, _col);
        (,,,uint total) = _clash.getBoughtCells(_gameId);
        if (total < 100) {
            _price = calculatePayAmount(price, cellType, _faction);
            _priceOriginal = calculatePayAmount(priceOriginal, cellType, _faction);
            if (price == 0) {
                _price = _price * 70 / 100;
            }
        }
        else {
            _price = calculatePayAmount(priceOriginal, cellType, _faction);
            _priceOriginal = _price;
        }
    }

    function getPayAmountForFill(IOnChainClash _clash, uint _gameId, uint _row, uint _col, uint _faction) public view returns (address _payToken, uint _price, uint _priceOriginal) {
        (,,,uint total) = _clash.getBoughtCells(_gameId);
        require(_row > 0 && _row < MAX_ROW_INDEX, "OnChainClashRuleV1: Wrong row");
        require(_col > 0 && _col < MAX_COL_INDEX, "OnChainClashRuleV1: Wrong col");
        require(_faction == m_f1 || _faction == m_f2 || _faction == m_f3, "OnChainClashRuleV1: Wrong faction");
        if (total < 100) {
            return (payToken, fill_price * 70 / 100, fill_price);
        }
        else {
            return (payToken, fill_price, fill_price);
        }
    }

    function validateNewCell(uint _rowValue_minus_1, uint _rowValue, uint _rowValue_add_1, uint _col, uint _faction) public pure returns (bool) {
        uint v0 =                           _rowValue        .bitOf_1_2_3(_col);
        uint v1 = _col > 0                ? _rowValue_minus_1.bitOf_1_2_3(_col - 1) : 0;
        uint v2 =                           _rowValue_minus_1.bitOf_1_2_3(_col    )    ;
        uint v3 = _col < MAX_COL_INDEX    ? _rowValue_minus_1.bitOf_1_2_3(_col + 1) : 0;
        uint v4 = _col > 0                ? _rowValue        .bitOf_1_2_3(_col - 1) : 0;
        uint v5 = _col < MAX_COL_INDEX    ? _rowValue        .bitOf_1_2_3(_col + 1) : 0;
        uint v6 = _col > 0                ? _rowValue_add_1  .bitOf_1_2_3(_col - 1) : 0;
        uint v7 =                           _rowValue_add_1  .bitOf_1_2_3(_col    )    ;
        uint v8 = _col < MAX_COL_INDEX    ? _rowValue_add_1  .bitOf_1_2_3(_col + 1) : 0;

        if (v0 == _faction) {
            return false;
        }

        // Không thể mua nếu đã bị vây 4 hướng
        // if (v2 == v4 && v2 == v5 && v2 == v7 && v2 != _faction && v2 != 0) {
        //     return false;
        // }

        if (v1 == _faction || 
            v2 == _faction || 
            v3 == _faction ||
            v4 == _faction || 
            v5 == _faction || 
            v6 == _faction || 
            v7 == _faction || 
            v8 == _faction) 
        {
            return true;
        }

        return false;
    }

    function verifyBound(uint[] memory _mapData, uint[] memory _maskBound, uint _faction) external pure returns (bool) {
        for (uint i = 0; i < _maskBound.length; i++) {
            uint r = _maskBound[i].v1();
            uint m = _maskBound[i].v2();
            if ((_mapData[r].v(_faction) & m) != m) {
                return false;
            }
        }

        return true;
    }

    function fill(uint[] memory _mapData, uint _rowStart, uint _colStart, uint _faction, uint _maxCellFill) external pure returns (uint[] memory, uint) {
        return (
            _faction == m_f1 ? fill1(_mapData, _rowStart, _colStart, _maxCellFill)
             : _faction == m_f2 ? fill2(_mapData, _rowStart, _colStart, _maxCellFill)
             : _faction == m_f3 ? fill3(_mapData, _rowStart, _colStart, _maxCellFill)
             : (_mapData, 0)
        );
    }

    function fill1(uint[] memory _mapData, uint _rowStart, uint _colStart, uint _maxCellFill) private pure returns (uint[] memory, uint) {
        uint[] memory stack = new uint[](_maxCellFill);
        uint iStack = 0;
        uint nStack = 1;

        stack[iStack] = _rowStart.set2(_colStart);
        _mapData[_rowStart] = _mapData[_rowStart].on1_off_2_3(_colStart);

        while (iStack < nStack) {
            uint row = stack[iStack].v1();
            uint col = stack[iStack++].v2();
            
            uint nr = row - 1;
            uint nc = col - 1;
            if (!_mapData[nr].bit1(col)) {
                _mapData[nr] = _mapData[nr].on1_off_2_3(col);
                stack[nStack++] = nr.set2(col);
            }
            if (!_mapData[row].bit1(nc)) {
                _mapData[row] = _mapData[row].on1_off_2_3(nc);
                stack[nStack++] = row.set2(nc);
            }
        
            nr = row + 1;
            nc = col + 1;
            if (!_mapData[nr].bit1(col)) {
                _mapData[nr] = _mapData[nr].on1_off_2_3(col);
                stack[nStack++] = nr.set2(col);
            }
            if (!_mapData[row].bit1(nc)) {
                _mapData[row] = _mapData[row].on1_off_2_3(nc);
                stack[nStack++] = row.set2(nc);
            }
        }

        return (_mapData, nStack);
    }

    function fill2(uint[] memory _mapData, uint _rowStart, uint _colStart, uint _maxCellFill) private pure returns (uint[] memory, uint) {
        uint[] memory stack = new uint[](_maxCellFill);
        uint iStack = 0;
        uint nStack = 1;

        stack[iStack] = _rowStart.set2(_colStart);
        _mapData[_rowStart] = _mapData[_rowStart].on2_off_1_3(_colStart);

        while (iStack < nStack) {
            uint row = stack[iStack].v1();
            uint col = stack[iStack++].v2();
            
            uint nr = row - 1;
            uint nc = col - 1;
            if (!_mapData[nr].bit2(col)) {
                _mapData[nr] = _mapData[nr].on2_off_1_3(col);
                stack[nStack++] = nr.set2(col);
            }
            if (!_mapData[row].bit2(nc)) {
                _mapData[row] = _mapData[row].on2_off_1_3(nc);
                stack[nStack++] = row.set2(nc);
            }
        
            nr = row + 1;
            nc = col + 1;
            if (!_mapData[nr].bit2(col)) {
                _mapData[nr] = _mapData[nr].on2_off_1_3(col);
                stack[nStack++] = nr.set2(col);
            }
            if (!_mapData[row].bit2(nc)) {
                _mapData[row] = _mapData[row].on2_off_1_3(nc);
                stack[nStack++] = row.set2(nc);
            }
        }

        return (_mapData, nStack);
    }

    function fill3(uint[] memory _mapData, uint _rowStart, uint _colStart, uint _maxCellFill) private pure returns (uint[] memory, uint) {
        uint[] memory stack = new uint[](_maxCellFill);
        uint iStack = 0;
        uint nStack = 1;

        stack[iStack] = _rowStart.set2(_colStart);
        _mapData[_rowStart] = _mapData[_rowStart].on3_off_1_2(_colStart);

        while (iStack < nStack) {
            uint row = stack[iStack].v1();
            uint col = stack[iStack++].v2();
            
            uint nr = row - 1;
            uint nc = col - 1;
            if (!_mapData[nr].bit3(col)) {
                _mapData[nr] = _mapData[nr].on3_off_1_2(col);
                stack[nStack++] = nr.set2(col);
            }
            if (!_mapData[row].bit3(nc)) {
                _mapData[row] = _mapData[row].on3_off_1_2(nc);
                stack[nStack++] = row.set2(nc);
            }
        
            nr = row + 1;
            nc = col + 1;
            if (!_mapData[nr].bit3(col)) {
                _mapData[nr] = _mapData[nr].on3_off_1_2(col);
                stack[nStack++] = nr.set2(col);
            }
            if (!_mapData[row].bit3(nc)) {
                _mapData[row] = _mapData[row].on3_off_1_2(nc);
                stack[nStack++] = row.set2(nc);
            }
        }

        return (_mapData, nStack);
    }
}
