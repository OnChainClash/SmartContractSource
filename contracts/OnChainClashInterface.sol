// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IOnChainClashRule {
    function getPayAmount(IOnChainClash _clash, uint _gameid, uint _row, uint _col, uint _faction) external view returns (address payToken, uint amount, uint amountOriginal);
    function getPayAmountForFill(IOnChainClash _clash, uint _gameid, uint _row, uint _col, uint _faction) external view returns (address payToken, uint amount, uint amountOriginal);
    function payToken() external view returns (address);
    function rows() external view returns (uint);
    function cols() external view returns (uint);
    function validateNewCell(uint _rowValue_minus_1, uint _rowValue, uint _rowValue_add_1, uint _col, uint _faction) external pure returns (bool);
    function fill(uint[] memory _mapData, uint _rowStart, uint _colStart, uint _faction, uint _maxCellFill) external view returns (uint[] memory, uint count);
    function verifyBound(uint[] memory _mapData, uint[] memory _maskBound, uint _faction) external view returns (bool);
    function getFillPrice() external view returns (uint);
}

interface IOnChainClash {
    struct Game {
        IOnChainClashRule rule;
        uint time; // createdAt, _finishAt, _startAt, _finishedAt
        uint reward; // total amount 
        uint winFaction;
        uint countBoughtCells; // [f1, f2, f3, total]
        uint cells; // total bought cell. 64bit [f1, f2, f3, [p4 = countCell In Finish Faction]]
        uint[3] payAmounts; // total payAmount for f1, f2, f3
    }

    function getBoughtCells(uint _gameId) external view returns (uint f1, uint f2, uint f3, uint total);
    function getCell(uint _gameId, uint _row, uint _col) external view returns (uint cellType, uint faction, uint height, uint price, uint priceOriginal, uint latestTime);
    function getGame(uint _gameId) external view returns (Game memory);
    function getMapData(uint _gameId) external view returns (uint[] memory);
}