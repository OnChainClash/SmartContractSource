const $ = BigInt;
var u256_1 = $`0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`;
var i192 = $`192`;
var i128 = $`128`;
var i64 = $`64`;
var i4 = $`4`;
var i3 = $`3`;
var i2 = $`2`;
var i1 = $`1`;
var i0 = $`0`;

var u1_255_192 = u256_1 << i192;
var u1_191_128 = u1_255_192 >> i64;
var u1_127_64 = u1_191_128 >> i64;
var u1_63_0 = u1_127_64 >> i64;

var u1_192 = $`1` << i192;
var u1_128 = $`1` << i128;
var u1_64 = $`1` << i64;
var u1_0 = $`1`;

function inseartChar(chuoi, kiTuThem, viTri) {
    if (viTri < 0 || viTri > chuoi.length) {
        console.error("Vị trí không hợp lệ");
        return chuoi;
    }

    var phanTruoc = chuoi.substring(0, viTri);
    var phanSau = chuoi.substring(viTri);

    // Nối chuỗi mới với kí tự cần thêm
    var chuoiMoi = phanTruoc + kiTuThem + phanSau;

    return chuoiMoi;
}

function to256Bit() {
    var v = this.toString(2);
    if (v.length > 256) {
        return v.slice(0, 256);
    }
    else if (v.length < 256) {
        var n = v.length
        for (var i = 0; i < 256 - n; i++) {
            v = '0' + v;
        }
    }

    var v = v.replace(/0/gi, ' ').replace(/1/gi, '.');
    v = inseartChar(v, "|", 64)
    v = inseartChar(v, "|", 129)
    v = inseartChar(v, "|", 194)

    return "|" + v + "|"
}

BigInt.prototype.to256Bit = to256Bit;

function c256(_v, _v4, _v3, _v2, _v1) {
    return (
        _v |
        (_v4 << i192 & u1_255_192) | 
        (_v3 << i128 & u1_191_128) | 
        (_v2 << i64 & u1_127_64) | 
        (_v1 & u1_63_0)
    );
}

function x64(_v) {
    return (
        (_v >> i192 & u1_63_0),
        (_v >> i128 & u1_63_0),
        (_v >> i64  & u1_63_0),
        (_v        & u1_63_0)
    );
}

function v(_v, _p) {
    if (_p == i4) return (_v >> i192 & u1_63_0);
    if (_p == i3) return (_v >> i128 & u1_63_0);
    if (_p == i2) return (_v >> i64  & u1_63_0);
    if (_p == i1) return (_v & u1_63_0);

    return i0;
}

function v4(_v) {
    return (_v >> i192 & u1_63_0);
}

function v3(_v) {
    return (_v >> i128 & u1_63_0);
}

function v2(_v) {
    return (_v >> i64 & u1_63_0);
}

function v1(_v) {
    return (_v & u1_63_0);
}

function be4(_v) {
    return (_v << i192 & u1_255_192);
}

function be3(_v) {
    return (_v << i128 & u1_191_128);
}

function be2(_v) {
    return (_v << i64 & u1_127_64);
}

function be1(_v) {
    return (_v & u1_63_0);
}

function merge(_v, _v4, _v3, _v2) {
    return (
        (_v4 << i192 & u1_255_192) | 
        (_v3 << i128 & u1_191_128) | 
        (_v2 << i64 & u1_127_64) | 
        (_v & u1_63_0)
    );
}

function set4(_v, _rv) {
    return _v & (~u1_255_192) | (_rv << i192);
}

function set3(_v, _rv) {
    return _v & (~u1_191_128) | (_rv << i128);
}

function set2(_v, _rv) {
    return _v & (~u1_127_64) | (_rv << i64);
}

function set1(_v, _rv) {
    return _v & (~u1_63_0) | _rv;
}

function add(_v, _p, _n) {
    return (
            _p == i1 ? _v & (~u1_63_0) | ((_v & u1_63_0) + _n)
        : _p == i2 ? _v & (~u1_127_64) | (((_v >> i64  & u1_63_0) + _n) << i64)
        : _p == ii3 ? _v & (~u1_191_128) | (((_v >> i128 & u1_63_0) + _n) << i128)
        : _v & (~u1_255_192) | (((_v >> i192 & u1_63_0) + _n) << i192)
    );
}

function sub(_v, _p, _n) {
    return (
            _p == i1 ? _v & (~u1_63_0) | ((_v & u1_63_0) - _n)
        : _p == i2 ? _v & (~u1_127_64) | (((_v >> i64  & u1_63_0) - _n) << i64)
        : _p == ii3 ? _v & (~u1_191_128) | (((_v >> i128 & u1_63_0) - _n) << i128)
        : _v & (~u1_255_192) | (((_v >> i192 & u1_63_0) - _n) << i192)
    );
}

function add4(_v, _n) {
    return _v & (~u1_255_192) | (((_v >> i192 & u1_63_0) + _n) << i192);
}

function add3(_v, _n) {
    return _v & (~u1_191_128) | (((_v >> i128 & u1_63_0) + _n) << i128);
}

function add2(_v, _n) {
    return _v & (~u1_127_64) | (((_v >> i64  & u1_63_0) + _n) << i64);
}

function add1(_v, _n) {
    return _v & (~u1_63_0) | ((_v & u1_63_0) + _n);
}

function sub4(_v, _n) {
    return _v & (~u1_255_192) | (((_v >> i192 & u1_63_0) - _n) << i192);
}

function sub3(_v, _n) {
    return _v & (~u1_191_128) | (((_v >> i128 & u1_63_0) - _n) << i128);
}

function sub2(_v, _n) {
    return _v & (~u1_127_64) | (((_v >> i64  & u1_63_0) - _n) << i64);
}

function sub1(_v, _n) {
    return _v & (~u1_63_0) | ((_v & u1_63_0) - _n);
}

function bit(_v, _p, _position) {
    if (_p == i4) {
        return _v & (u1_192 << _position) != i0 ? true : false;
    }

    if (_p == i3) {
        return _v & (u1_128 << _position) != i0 ? true : false;
    }

    if (_p == i2) {
        return _v & (u1_64 << _position) != i0 ? true : false;
    i}

    if (_p == 1) {
        return _v & (u1_0 << _position) != i0 ? true : false;
    }

    return false;
}

function bit4(_v, _position) {
    return (_v & (u1_192 << _position)) != i0 ? true : false;
}

function bit3(_v, _position) {
    return _v & (u1_128 << _position) != i0 ? true : false;
}

function bit2(_v, _position) {
    return _v & (u1_64 << _position) != i0 ? true : false;
}

function bit1(_v, _position) {
    return _v & (u1_0 << _position) != i0 ? true : false;
}

function hasBit_in_1_2_3(_v, _position) {
    return (
            _v & (u1_128 << _position) != i0 
        || _v & (u1_64 << _position) != i0 
        || _v & (u1_0 << _position) != i0
    );
}

function bitOf_1_2_3(_v, _position) {
    if ((_v & (u1_128 << _position)) != i0) return i3;
    if ((_v & (u1_64 << _position)) != i0) return i2;
    if ((_v & (u1_0 << _position)) != i0) return i1;

    return i0;
}

function on4(_v, _position) {
    return (
        (_v | (u1_192 << _position))
    );
}

function on3(_v, _position) {
    return (
        (_v | (u1_128 << _position))
    );
}

function on2(_v, _position) {
    return (
        (_v | (u1_64 << _position))
    );
}

function on1(_v, _position) {
    return (
        (_v | (u1_0 << _position))
    );
}

function gameOnBit(_v, _p, _position) {
    return ((_v
        & (~(u1_128 << _position))
        & (~(u1_64 << _position))
        & (~(u1_0 << _position))
    ) | (
          _p == i1 ? (u1_0 << _position)
        : _p == i2 ? (u1_64 << _position)
        : _p == i3 ? (u1_128 << _position)
        : i0
    ));
}


const map = `
0 0 0 0 0 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 
1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 
1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 
1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 
`

// 0 land
// 1 sea
// 2: faction 1 on land
// 3: faction 2 on land
// 4: faction 3 on land
// 5: faction on sea
// 6: faction on sea
// 7: faction on sea
function MapArr() {
  return map
    .trim()
    .split("\n")
    .map(e => e.trim())
    .map(l => {
      return l.split(' ')
        .map(e => e.trim())
        .reverse()
        .reduce((s, v, i) => {
            v = parseInt(v);
            if ([1, 5, 6, 7].includes(v)) {
                s = on4(s, $(i))
            }

            if ([2, 5].includes(v)) {
                s = on1(s, $(i))
            }

            if ([3, 6].includes(v)) {
                s = on2(s, $(i))
            }

            if ([4, 7].includes(v)) {
                s = on3(s, $(i))
            }

            return s
        }, BigInt(0))
    })
}

module.exports = {
    MapArr,
    ShowBit: function(v) {
        console.log('____')
        console.log(v.map(e => e.to256Bit()).join('\n'))
        console.log('____')
    },

    ShowInfo: function(game) {
        console.log('createdAt: ', game.createdAt);
        console.log('finishAt: ', game.finishAt);
        console.log('startAt: ', game.startAt);
        console.log('finishedAt: ', game.finishedAt);
        console.log('reward: ', game.reward);
        console.log('winFaction: ', game.winFaction);
        console.log('cellsFaction1: ', game.cellsFaction1);
        console.log('cellsFaction2: ', game.cellsFaction2);
        console.log('cellsFaction3: ', game.cellsFaction3);
        console.log('countCell: ', game.countCell);
        console.log('payAmountFaction1: ', game.payAmountFaction1);
        console.log('payAmountFaction2: ', game.payAmountFaction2);
        console.log('payAmountFaction3: ', game.payAmountFaction3);
    },
    
    ShowFaction: function(game, {
        highlight1 = [], 
        highlight2 = [], 
        highlight3 = [],
        range = null
    }) {

        console.log('createdAt: ', game.createdAt);
        console.log('finishAt: ', game.finishAt);
        console.log('startAt: ', game.startAt);
        console.log('finishedAt: ', game.finishedAt);
        console.log('reward: ', game.reward);
        console.log('winFaction: ', game.winFaction);
        console.log('cellsFaction1: ', game.cellsFaction1);
        console.log('cellsFaction2: ', game.cellsFaction2);
        console.log('cellsFaction3: ', game.cellsFaction3);
        console.log('countCell: ', game.countCell);
        console.log('payAmountFaction1: ', game.payAmountFaction1);
        console.log('payAmountFaction2: ', game.payAmountFaction2);
        console.log('payAmountFaction3: ', game.payAmountFaction3);

        var v = game.mapData

        var l = ""
        for (var i = 0; i < 64; i++) {
            l += i < 10 ? `|0${i}|` : `|${i}|`;
        }

        console.log("     " + l)
        console.log(
            v.map((e, row) => {
                var r = row < 10 ? `0${row}|  ` : `${row}|  `;
                for (var col = 0; col < 64; col++) {
                    var f = bitOf_1_2_3(e, BigInt(col));
                    
                    if (f == 0) {
                        r += "  ";
                    }
                    else {
                        r += ` ${f}`
                    }

                    if (highlight1.find(h => h[0] == row && h[1] == col)) {
                        r += '*'
                    }
                    else if (highlight2.find(h => h[0] == row && h[1] == col)) {
                        r += '.'
                    }
                    else if (highlight3.find(h => h[0] == row && h[1] == col)) {
                        r += 'o'
                    }
                    else {
                        r += ' '
                    }
                    if (range && (
                        row == range.maxRow 
                     || row == range.minRow
                     || col == range.maxCol 
                     || col == range.minCol
                    )
                    ) {
                        r += "#";
                    }
                    else {
                        r += ' '
                    }
                }

                return r;
            })
            .join('\n')
        )
    },
    Show: function(game, { 
        highlight1 = [], 
        highlight2 = [], 
        highlight3 = [] 
    }) {
        console.log('createdAt: ', game.createdAt);
        console.log('finishAt: ', game.finishAt);
        console.log('startAt: ', game.startAt);
        console.log('finishedAt: ', game.finishedAt);
        console.log('reward: ', game.reward);
        console.log('winFaction: ', game.winFaction);
        console.log('cellsFaction1: ', game.cellsFaction1);
        console.log('cellsFaction2: ', game.cellsFaction2);
        console.log('cellsFaction3: ', game.cellsFaction3);
        console.log('countCell: ', game.countCell);
        console.log('payAmountFaction1: ', game.payAmountFaction1);
        console.log('payAmountFaction2: ', game.payAmountFaction2);
        console.log('payAmountFaction3: ', game.payAmountFaction3);

        var v = game.mapData
        var l = ""
        for (var i = 0; i < 64; i++) {
            l += i < 10 ? `0${i} ` : `${i} `;
        }

        console.log("    " + l)
        console.log(
            v.map((e, row) => {
                var r = row < 10 ? `0${row}| ` : `${row}| `;
                for (var col = 0; col < 64; col++) {
                    var f = bitOf_1_2_3(e, BigInt(col));
                    if (f == 0) {
                        r += bit4(e, BigInt(col)) ? " ." : "  ";
                    }
                    else {
                        r += bit4(e, BigInt(col)) ? `.${f}` : ` ${f}`;
                    }

                    if (highlight1.find(h => h[0] == row && h[1] == col)) {
                        r += '*'
                    }
                    else if (highlight2.find(h => h[0] == row && h[1] == col)) {
                        r += 'x'
                    }
                    else if (highlight3.find(h => h[0] == row && h[1] == col)) {
                        r += 'o'
                    }
                    else {
                        r += ' '
                    }
                }

                return r;
            })
            .join('\n')
        )
    },
    v1,
    v2,
    v3,
    set1, 
    set2,
    set3,
    set4,
    on1,
    on2,
    on3,
    on4
}