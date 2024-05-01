var u256_1 = BigInt(`0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`)
var i192 = BigInt(`192`)
var i128 = BigInt(`128`)
var i64 = BigInt(`64`)
var i4 = BigInt(`4`)
var i3 = BigInt(`3`)
var i2 = BigInt(`2`)
var i1 = BigInt(`1`)
var i0 = BigInt(`0`)

var u1_255_192 = u256_1 << i192;
var u1_191_128 = u1_255_192 >> i64;
var u1_127_64 = u1_191_128 >> i64;
var u1_63_0 = u1_127_64 >> i64;

var u1_192 = BigInt(`1`) << i192;
var u1_128 = BigInt(`1`) << i128;
var u1_64 = BigInt(`1`) << i64;
var u1_0 = BigInt(`1`);

function bitOf_1_2_3(_v: any, _position: any): bigint {
    if ((_v & (u1_128 << _position)) != i0) return i3;
    if ((_v & (u1_64 << _position)) != i0) return i2;
    if ((_v & (u1_0 << _position)) != i0) return i1;

    return i0;
}


function bit4(_v: any, _position: any): boolean {
    return (_v & (u1_192 << _position)) != i0 ? true : false;
}

function on4(_v: any, _position: any) {
    return (
        (_v | (u1_192 << _position))
    );
}

function on3(_v: any, _position: any) {
    return (
        (_v | (u1_128 << _position))
    );
}

function on2(_v: any, _position: any) {
    return (
        (_v | (u1_64 << _position))
    );
}

function on1(_v: any, _position: any) {
    return (
        (_v | (u1_0 << _position))
    );
}

export function MapBitToMapNumber(map: BigInt[]): {
    factions: number[][],
    background: number[][],
} {
    var factions: number[][] = [];
    var background: number[][] = [];

    map.map((e, iM) => {
        for (var i = 0; i < 64; i++) {
            var f = bitOf_1_2_3(e, BigInt(i));
            factions[iM] = factions[iM] || [];
            factions[iM][i] = Number(f);

            background[iM] = background[iM] || [];
            background[iM][i] = bit4(e, BigInt(i)) ? 1 : 0;
        }
    })

    return {
        factions,
        background
    };
}

export function MapNumberToBit(background: number[][], faction: number[][]): BigInt[] {
    var map: BigInt[] = [];
    if (background.length != 64) throw Error("Size of background is invalid");
    if (faction.length != 64) throw Error("Size of faction is invalid");
    for (var i = 0; i < 64; i++) {
        map[i] = BigInt(0);
    }
    for (var i = 0; i < 64; i++) {
        if (background[i].length != 64) throw Error("Collume size of background is invalid");

        for (var j = 0; j < 64; j++) {
            if (background[i][j] == 1) {
                map[i] = on4(map[i], BigInt(j))
            }
        }
    }

    for (var i = 0; i < 64; i++) {
        if (faction[i].length != 64) throw Error("Collume size of faction is invalid");

        for (var j = 0; j < 64; j++) {
            if (faction[i][j] == 1) {
                map[i] = on1(map[i], BigInt(j))
            }
            else if (faction[i][j] == 2) {
                map[i] = on2(map[i], BigInt(j))
            }
            else if (faction[i][j] == 3) {
                map[i] == on3(map[i], BigInt(j))
            }
        }
    }

    return map;
}


/**
 * Xin lỗi anh em vì không tách thành các hàm nhỏ :D
 * Nhiệm vụ của hàm này là khởi tạo được đường chỉ dẫn bao quanh từ điểm startRow và startCol
 * Đồng thời toạ maskFill để cho lên smartcontract đổi giá trị các cell được nhanh và tiết kiệm gas
 * Đường chỉ dấn bao giúp smart contract verify lại xem có thực sự đã bao chưa, tránh gian lận
 * và lỗi khi nhiều người chơi đồng thời
*/
export function FindBound(factions: number[][], startRow: number, startCol: number) {
    const board = factions
    const rows = board.length
    const cols = board[0].length

    let faction = board[startRow][startCol]
    let group: [number, number][] = []
    let bound: [number, number][] = []
    let liberty: [number, number][] = []
    let fill: [number, number][] = []
    var maskFillsMatrix: number[][] = []
    let boundDirection: number[] = []
    let maskFill: bigint[] = []
    var range = {
        minRow: rows + 1,
        maxRow: -1,
        minCol: cols + 1,
        maxCol: -1
    }

    let visited = new Array(rows).fill(0).map(() => new Array(cols).fill(false))

    /*
       1  2  3
        \ | /
      8 -   - 4
        / | \  
       7  6  5
    */

    const DIRECTION_8 = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
        [0, -1],
    ]

    const DIRECTION_4 = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
    ]

    function isValidPosition(r: number, c: number) {
        return r >= 0 && r < rows && c >= 0 && c < cols
    }

    function dfsFindBound(row: number, col: number, faction: number,
        group: [number, number][],
        liberty: [number, number][],
        range: {
            minRow: number,
            maxRow: number,
            minCol: number,
            maxCol: number
        }
    ) {
        visited[row][col] = true
        group.push([row, col])

        for (let [dRow, dCol] of DIRECTION_4) {
            let newRow = row + dRow
            let newCol = col + dCol

            if (isValidPosition(newRow, newCol) &&
                board[newRow][newCol] != faction
            ) {
                if (!liberty.find(l => l[0] == newRow && l[1] == newCol)) {
                    liberty.push([newRow, newCol])

                    if (newRow > range.maxRow) range.maxRow = newRow
                    if (newRow < range.minRow) range.minRow = newRow
                    if (newCol > range.maxCol) range.maxCol = newCol
                    if (newCol < range.minCol) range.minCol = newCol
                }
            }
        }

        for (let [dRow, dCol] of DIRECTION_8) {
            let newRow = row + dRow
            let newCol = col + dCol

            if (isValidPosition(newRow, newCol)
                && board[newRow][newCol] === faction
                && !visited[newRow][newCol]) {

                dfsFindBound(newRow, newCol, faction, group, liberty, range)
            }
        }
    }

    dfsFindBound(startRow, startCol, faction, group, liberty, range)

    if (liberty.length < 4) {
        return {
            group,
            bound,
            boundDirection,
            maskFill,
            maskFillsMatrix,
            liberty,
            range,
            fill
        };
    }

    visited = new Array(rows).fill(0).map(() => new Array(cols).fill(false));
    let check = new Array(rows).fill(0).map(() => new Array(cols).fill(0));
    function dfsFill(row: number, col: number, faction: number, group: [number, number][], countCall: number) {
        visited[row][col] = true;
        group.push([row, col]);
        check[row][col] = 1; // mark as cover
        for (const [dRow, dCol] of DIRECTION_4) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (!(
                range.minRow <= newRow && newRow <= range.maxRow
                && range.minCol <= newCol && newCol <= range.maxCol
                && 0 <= newRow && newRow < rows
                && 0 <= newCol && newCol < cols
            ) || check[newRow][newCol] == -1) {
                // if out of bound or meet the not cover area
                group.forEach((e) => {
                    check[e[0]][e[1]] = -1;
                });
                group = [];
            } else {
                try {
                    if (board[newRow][newCol] !== faction && !visited[newRow][newCol]) {
                        dfsFill(newRow, newCol, faction, group, countCall+1);
                    }
                }
                catch (ex) {
                    console.error(ex)
                    console.log({
                        countCall,
                        row,
                        col,
                        range,
                        newRow,
                        newCol,
                        check: check.map(e => e.map(ee => ee ? (ee == 1 ? 'o' : 'x') : ' ')).map(e => e.join(' ')),
                        visited: visited.map(e => e.map(ee => ee ? 'o' : ' ')).map(e => e.join(' ')),
                        board: board.map(e => e.map(ee => ee ? 'o' : ' ')).map(e => e.join(' ')),
                    })
                    process.exit(0)
                }
            }
        }
    }

    liberty.forEach((l) => {
        dfsFill(l[0], l[1], faction, [], 1);
    });

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (check[row][col] == 1) {
                fill.push([row, col]);
            }
        }
    }

    /**
     * chia vùng fill ban đầu thành nhiều nhóm nhỏ, nếu vùng fill này không liên kết với nhau
     * bằng chiều ngang và dọc
     * Ví dụ: x và o đều là những điểm cần biến đổi thành giá trị mới khi đã bị bao vây
     * tuy nhiên x và o liên kết qua một đường chéo, nên sẽ chia ra làm 2 vùng
     *      . . . * * * . . . 
     *      . * * o o o * . . 
     *      * x x * o o o * . 
     *      * x x * o o o * . 
     *      . * * . . * * . . 
     * 
     * Mục đích tách nhỏ để tạo đường chỉ dẫn đường bound tối ưu và dễ dàng hơn
     */
    let smallFills: [number, number][][] = [];
    let tmpFills = fill.concat();
    let currentFillIndex = 0;

    function dfsSmallFill(row: number, col: number, sFill: [number, number][]) {
        for (const [dRow, dCol] of DIRECTION_4) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            let near = tmpFills.find(tf => tf[0] == newRow && tf[1] == newCol);
            if (near) {
                sFill.push(near)
                tmpFills = tmpFills.filter(e => e != near)
                dfsSmallFill(near[0], near[1], sFill);
            }
        }

        return sFill
    }

    while (tmpFills.length > 0) {
        let p: [number, number] = tmpFills.pop() as [number, number]
        smallFills[currentFillIndex] = dfsSmallFill(p[0], p[1], [p])
        currentFillIndex++
    }

    /*
       1  2  3
        \ | /
      8 - 0 - 4
        / | \  
       7  6  5
    */

    // Từ những cụm fill nhỏ, tạo thành các đường bao nhỏ chỉ quanh khu vực này
    smallFills.forEach(sf => {
        let sb: [number, number][] = []

        // tạo đường bound chính
        sf.forEach(f => {
            let row = f[0]
            let col = f[1]

            for (const [dRow, dCol] of DIRECTION_4) {
                const newRow = row + dRow;
                const newCol = col + dCol;

                if (board[newRow][newCol] == faction 
                    && !sb.find(b => b[0] == newRow && b[1] == newCol)) {
                    sb.push([newRow, newCol])
                }
            }
        })

        let row = startRow
        var col = startCol
        while(sb.length > 0) {
            for (let i = 0; i < DIRECTION_8.length; i++) {
                const [dRow, dCol] = DIRECTION_8[i]

                const newRow = row + dRow;
                const newCol = col + dCol;

                if (sb.find(sbe => sbe[0] == newRow && sbe[1] == newCol)) {
                    boundDirection.push(i + 1)
                    sb = sb.filter(sbe => !(sbe[0] == newRow && sbe[1] == newCol))
                    row = newRow
                    col = newCol
                    break;
                }
            }
        }
    })


//     console.log(`
// 1   2  3
//   \\ | /
// 8 - 0 - 4
//   / | \\  
// 7   6  5
//     `)
//     console.log(boundDirection)

    // tạo đường bound chính
    fill.forEach(f => {
        let row = f[0]
        let col = f[1]

        for (const [dRow, dCol] of DIRECTION_4) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (board[newRow][newCol] == faction 
                && !bound.find(b => b[0] == newRow && b[1] == newCol)) {
                bound.push([newRow, newCol])
            }
        }
    })
    range = {
        minRow: rows + 1,
        maxRow: -1,
        minCol: cols + 1,
        maxCol: -1
    }

    bound.forEach(b => {
        if (range.minRow > b[0]) range.minRow = b[0]
        if (range.maxRow < b[0]) range.maxRow = b[0]
        if (range.minCol > b[1]) range.minCol = b[1]
        if (range.maxCol < b[1]) range.maxCol = b[1]
    })

    for (let row = range.minRow; row <= range.maxRow; row++) {
        maskFillsMatrix[row - range.minRow] = []
        for (let col = range.minCol; col <= range.maxCol; col++) {
            maskFillsMatrix[row - range.minRow][col - range.minCol] = (
                bound.find(b => b[0] == row && b[1] == col) ? 1 
                : fill.find(f => f[0] == row && f[1] == col) ? 1 
                : 0
            )
        }
    }
    
    maskFill = maskFillsMatrix.map(e => e.reverse())
        .map(e => e.join(''))
        .map(e => BigInt('0b' + e))


    // console.log(maskFill)

    return {
        group,
        bound,
        boundDirection,
        maskFill,
        maskFillsMatrix,
        liberty,
        range,
        fill
    };
}