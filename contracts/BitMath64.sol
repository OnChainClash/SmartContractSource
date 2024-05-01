// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

library BitMath64 {
    uint constant u256_1 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint constant u1_255_192 = u256_1 << 192;
    uint constant u1_191_128 = u1_255_192 >> 64;
    uint constant u1_127_64 = u1_191_128 >> 64;
    uint constant u1_63_0 = u1_127_64 >> 64;

    uint constant u1_192 = 1 << 192;
    uint constant u1_128 = 1 << 128;
    uint constant u1_64 = 1 << 64;
    uint constant u1_0 = 1;

    function c256(uint _v, uint _v4, uint _v3, uint _v2, uint _v1) internal pure returns (uint) {
        return (
            _v |
            (_v4 << 192 & u1_255_192) | 
            (_v3 << 128 & u1_191_128) | 
            (_v2 << 64 & u1_127_64) | 
            (_v1 & u1_63_0)
        );
    }

    function c256(uint _v, uint _v3, uint _v2, uint _v1) internal pure returns (uint) {
        return (
            _v |
            (_v3 << 128 & u1_191_128) | 
            (_v2 << 64 & u1_127_64) | 
            (_v1 & u1_63_0)
        );
    }

    function c256(uint _v, uint _v2, uint _v1) internal pure returns (uint) {
        return (
            _v |
            (_v2 << 64 & u1_127_64) | 
            (_v1 & u1_63_0)
        );
    }

    function c256(uint _v, uint _v1) internal pure returns (uint) {
        return (
            _v |
            (_v1 & u1_63_0)
        );
    }

    function x64(uint _v) internal pure returns (uint, uint, uint, uint) {
        return (
            (_v >> 192 & u1_63_0),
            (_v >> 128 & u1_63_0),
            (_v >> 64  & u1_63_0),
            (_v        & u1_63_0)
        );
    }

    function v(uint _v, uint _p) internal pure returns (uint) {
        if (_p == 4) return (_v >> 192 & u1_63_0);
        if (_p == 3) return (_v >> 128 & u1_63_0);
        if (_p == 2) return (_v >> 64  & u1_63_0);
        if (_p == 1) return (_v & u1_63_0);

        return 0;
    }

    function v4(uint _v) internal pure returns (uint) {
        return (_v >> 192 & u1_63_0);
    }

    function v3(uint _v) internal pure returns (uint) {
        return (_v >> 128 & u1_63_0);
    }

    function v2(uint _v) internal pure returns (uint) {
        return (_v >> 64  & u1_63_0);
    }

    function v1(uint _v) internal pure returns (uint) {
        return (_v & u1_63_0);
    }

    function be4(uint _v) internal pure returns (uint) {
        return (_v << 192 & u1_255_192);
    }

    function be3(uint _v) internal pure returns (uint) {
        return (_v << 128 & u1_191_128);
    }

    function be2(uint _v) internal pure returns (uint) {
        return (_v << 64 & u1_127_64);
    }

    function be1(uint _v) internal pure returns (uint) {
        return (_v & u1_63_0);
    }

    // merge other number and it alway be layer 1
    function merge(uint _v, uint _v4, uint _v3, uint _v2) internal pure returns (uint) {
        return (
            (_v4 << 192 & u1_255_192) | 
            (_v3 << 128 & u1_191_128) | 
            (_v2 << 64 & u1_127_64) | 
            (_v & u1_63_0)
        );
    }

    function merge(uint _v, uint _v3, uint _v2) internal pure returns (uint) {
        return (
            (_v3 << 128 & u1_191_128) | 
            (_v2 << 64 & u1_127_64) | 
            (_v & u1_63_0)
        );
    }

    function merge(uint _v, uint _v2) internal pure returns (uint) {
        return (
            (_v2 << 64 & u1_127_64) | 
            (_v & u1_63_0)
        );
    }

    function set4(uint _v, uint _rv) internal pure returns (uint) {
        return _v & (~u1_255_192) | (_rv << 192);
    }

    function set3(uint _v, uint _rv) internal pure returns (uint) {
        return _v & (~u1_191_128) | (_rv << 128);
    }

    function set2(uint _v, uint _rv) internal pure returns (uint) {
        return _v & (~u1_127_64) | (_rv << 64);
    }

    function set1(uint _v, uint _rv) internal pure returns (uint) {
        return _v & (~u1_63_0) | _rv;
    }

    function onBitMask4(uint _v, uint _mask) internal pure returns (uint) {
        return _v | (_mask << 192);
    }

    function onBitMask3(uint _v, uint _mask) internal pure returns (uint) {
        return _v | (_mask << 128);
    }

    function onBitMask2(uint _v, uint _mask) internal pure returns (uint) {
        return _v | (_mask << 64);
    }

    function onBitMask1(uint _v, uint _mask) internal pure returns (uint) {
        return _v | _mask;
    }

    function offBitMask4(uint _v, uint _mask) internal pure returns (uint) {
        return _v & ~(_mask << 192);
    }

    function offBitMask3(uint _v, uint _mask) internal pure returns (uint) {
        return _v & ~(_mask << 128);
    }

    function offBitMask2(uint _v, uint _mask) internal pure returns (uint) {
        return _v & ~(_mask << 64);
    }

    function offBitMask1(uint _v, uint _mask) internal pure returns (uint) {
        return _v & ~_mask;
    }

    function add(uint _v, uint _p, uint _n) internal pure returns (uint) {
        return (
              _p == 1 ? _v & (~u1_63_0) | ((_v & u1_63_0) + _n)
            : _p == 2 ? _v & (~u1_127_64) | (((_v >> 64  & u1_63_0) + _n) << 64)
            : _p == 3 ? _v & (~u1_191_128) | (((_v >> 128 & u1_63_0) + _n) << 128)
            : _v & (~u1_255_192) | (((_v >> 192 & u1_63_0) + _n) << 192)
        );
    }

    function sub(uint _v, uint _p, uint _n) internal pure returns (uint) {
        return (
              _p == 1 ? _v & (~u1_63_0) | ((_v & u1_63_0) - _n)
            : _p == 2 ? _v & (~u1_127_64) | (((_v >> 64  & u1_63_0) - _n) << 64)
            : _p == 3 ? _v & (~u1_191_128) | (((_v >> 128 & u1_63_0) - _n) << 128)
            : _v & (~u1_255_192) | (((_v >> 192 & u1_63_0) - _n) << 192)
        );
    }

    function add4(uint _v, uint _n) internal pure returns (uint) {
        return _v & (~u1_255_192) | (((_v >> 192 & u1_63_0) + _n) << 192);
    }

    function add3(uint _v, uint _n) internal pure returns (uint) {
        return _v & (~u1_191_128) | (((_v >> 128 & u1_63_0) + _n) << 128);
    }

    function add2(uint _v, uint _n) internal pure returns (uint) {
        return _v & (~u1_127_64) | (((_v >> 64  & u1_63_0) + _n) << 64);
    }

    function add1(uint _v, uint _n) internal pure returns (uint) {
        return _v & (~u1_63_0) | ((_v & u1_63_0) + _n);
    }

    function sub4(uint _v, uint _n) internal pure returns (uint) {
        return _v & (~u1_255_192) | (((_v >> 192 & u1_63_0) - _n) << 192);
    }

    function sub3(uint _v, uint _n) internal pure returns (uint) {
        return _v & (~u1_191_128) | (((_v >> 128 & u1_63_0) - _n) << 128);
    }

    function sub2(uint _v, uint _n) internal pure returns (uint) {
        return _v & (~u1_127_64) | (((_v >> 64  & u1_63_0) - _n) << 64);
    }

    function sub1(uint _v, uint _n) internal pure returns (uint) {
        return _v & (~u1_63_0) | ((_v & u1_63_0) - _n);
    }

    // kiểu tra bit ở vị trị trí _position thuộc layer _p là 0 hay 1
    function bit(uint _v, uint _p, uint _position) internal pure returns (bool) {
        if (_p == 4) {
            return _v & (u1_192 << _position) != 0 ? true : false;
        }

        if (_p == 3) {
            return _v & (u1_128 << _position) != 0 ? true : false;
        }

        if (_p == 2) {
            return _v & (u1_64 << _position) != 0 ? true : false;
        }

        if (_p == 1) {
            return _v & (u1_0 << _position) != 0 ? true : false;
        }

        return false;
    }

    function bit4(uint _v, uint _position) internal pure returns (bool) {
        return _v & (u1_192 << _position) != 0 ? true : false;
    }

    function bit3(uint _v, uint _position) internal pure returns (bool) {
        return _v & (u1_128 << _position) != 0 ? true : false;
    }

    function bit2(uint _v, uint _position) internal pure returns (bool) {
        return _v & (u1_64 << _position) != 0 ? true : false;
    }

    function bit1(uint _v, uint _position) internal pure returns (bool) {
        return _v & (u1_0 << _position) != 0 ? true : false;
    }

    function hasBit_in_1_2_3(uint _v, uint _position) internal pure returns (bool) {
        return (
               _v & (u1_128 << _position) != 0 
            || _v & (u1_64 << _position) != 0 
            || _v & (u1_0 << _position) != 0
        );
    }

    // kiểm tra xem bit ở vị trí _position thuộc layer nào
    function bitOf_1_2_3(uint _v, uint _position) internal pure returns (uint) {
        if (_v & (u1_128 << _position) != 0) return 3;
        if (_v & (u1_64 << _position) != 0) return 2;
        if (_v & (u1_0 << _position) != 0) return 1;

        return 0;
    }

    function on4(uint _v, uint _position) internal pure returns (uint) {
        return (_v | (u1_192 << _position));
    }
    function on3(uint _v, uint _position) internal pure returns (uint) {
        return (_v | (u1_128 << _position));
    }
    function on2(uint _v, uint _position) internal pure returns (uint) {
        return (_v | (u1_64 << _position));
    }
    function on1(uint _v, uint _position) internal pure returns (uint) {
        return (_v | (u1_0 << _position));
    }

    // bật bit ở layer 3, tắt ở layer 1, 2
    function on3_off_1_2(uint _v, uint _position) internal pure returns (uint) {
        return (
            (_v | (u1_128 << _position))
            & (~(u1_64 << _position))
            & (~(u1_0 << _position))
        );
    }

    function on2_off_1_3(uint _v, uint _position) internal pure returns (uint) {
        return (
            (_v | (u1_64 << _position))
            & (~(u1_128 << _position))
            & (~(u1_0 << _position))
        );
    }

    function on1_off_2_3(uint _v, uint _position) internal pure returns (uint) {
        return (
            (_v | (u1_0 << _position))
            & (~(u1_128 << _position))
            & (~(u1_64 << _position))
        );
    }

    function gameOnBit(uint _v, uint _p, uint _position) internal pure returns (uint) {
        return ((_v
            & (~(u1_128 << _position))
            & (~(u1_64 << _position))
            & (~(u1_0 << _position))
        ) | (
              _p == 1 ? (u1_0 << _position)
            : _p == 2 ? (u1_64 << _position)
            : _p == 3 ? (u1_128 << _position)
            : 0
        ));
    }
}