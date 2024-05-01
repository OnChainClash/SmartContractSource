import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

import MAP from "../MapArr.js"
import { OnChainClash } from "../typechain-types/contracts/OnChainClash.sol/OnChainClash.js";
import { OnChainClashPool } from "../typechain-types/contracts/OnChainClash.sol/OnChainClashPool.js";
import { OnChainClashPayment } from "../typechain-types/contracts/OnChainClash.sol/OnChainClashPayment.js";
import { FindBound, MapBitToMapNumber, MapNumberToBit } from "../OnChainClashLib.ts";

import secp256k1 from 'secp256k1'

var signerKey1 = '0x240f6537e5e07652bd87c424461d6db3fb3f11aed988be775c24dfa735a2a691'

// const CHAIN_ID = 28122024;
const CHAIN_ID = 31337;

function generateProof(privateKey: string, types: string[], values: any[]) {
  var expiredTime = Math.floor(Date.now() / 1000) + 1000
  var msg = ethers.solidityPackedKeccak256(types.concat(["uint"]), values.concat([expiredTime]))
  
  var pk = privateKey;
  if (pk.indexOf('0x') == 0) {
      pk = pk.slice(2)
  }

  var msgBytes = Buffer.from(msg.slice(2), 'hex')
  var pkBytes = Buffer.from(pk, 'hex')
  const sig = secp256k1.ecdsaSign(msgBytes, pkBytes)
  const ret = {
      v: sig.recid + 27,
      r: sig.signature.slice(0, 32),
      s: sig.signature.slice(32, 64),
      expiredTime: expiredTime
  }
  return ret
}

async function Buy(
  clash: any,
  rule: any,
  from: any,
  gameId: number,
  bRow: number, bCol: number, _faction: number
) {
  const p = await rule.getPayAmount(await clash.getAddress(), gameId, bRow, bCol, _faction);

  var proof = generateProof(
    signerKey1,
    ["uint", "address", "address", "uint", "uint", "uint", "uint"], 
    [CHAIN_ID, await clash.getAddress(), from.address, gameId, bRow, bCol, _faction]
  );

  await expect(clash.connect(from).buyCell(gameId, bRow, bCol, _faction, [proof], {
    value: p[1],
  }))
  .to.emit(clash, "BuyACell")
}

async function Fill(
  clash: any,
  rule: any,
  from: any,
  gameId: number,
  rowStart: number,
  colStart: number,
  _faction: number,
  max: number,
  bound: number[]
) {
  const p = await rule.getPayAmountForFill(await clash.getAddress(), gameId, rowStart, colStart, _faction);
  var proof = generateProof(
    signerKey1,
    ["uint", "address", "address", "uint", "uint", "uint", "uint"], 
    [CHAIN_ID, await clash.getAddress(), from.address, gameId, rowStart, colStart, _faction]
  );
  await expect(clash.connect(from).fillFaction(
    gameId,
    rowStart,
    colStart,
    _faction,
    max,
    bound,
    [proof],
    {
      value: p[1],
    }))
    .to.emit(clash, "FillFaction")
}

async function NewGame(clash: any, rule: any, startAfter: any, finishAfter: any, map = {
  faction1: [{ row: 5, col: 10 }, { row: 5, col: 11 }, { row: 5, col: 12 }, { row: 5, col: 13 }],
  faction2: [{ row: 20, col: 10 }, { row: 20, col: 11 }, { row: 20, col: 12 }, { row: 20, col: 13 }],
  faction3: [{ row: 40, col: 10 }, { row: 40, col: 11 }, { row: 40, col: 12 }, { row: 40, col: 13 }]
}) {
  const start = Math.round(Date.now() / 1000) + startAfter
  const finish = start + finishAfter;
  await clash.newGame(
    rule.getAddress(),
    0,
    start,
    finish,
    MAP.MapArr(),
    map.faction1,
    map.faction2,
    map.faction3
  );

  await time.increaseTo(await clash.getBlockTimestamp() + BigInt(100));
}

describe("OnChainClash", function () {
  async function deployContract() {
    const [owner, operator, player1, player2, player3] = await ethers.getSigners()

    const Rule = await ethers.getContractFactory("OnChainClashRuleV1");
    const rule = await Rule.deploy();

    const Clash = await ethers.getContractFactory("OnChainClash");
    const clash = await Clash.deploy();

    await clash.setOperator(owner, true);
    await clash.setOperator(operator, true);

    var signer1 = new ethers.Wallet(signerKey1)
    
    await clash.setSigner(signer1.address, true);

    console.log('-------', await clash.getChainID(), signer1.address);

    return { clash, rule, owner, operator, signer1, player1, player2, player3 }
  }
  /** */
  describe("OnChainClashPayment", function () {
    it("Kiểm tra setup faction", async function () {
      const { rule } = await loadFixture(deployContract);
      expect(await rule.rows()).to.equal(64);
      expect(await rule.cols()).to.equal(64);
      expect(await rule.m_f1()).to.equal(1);
      expect(await rule.m_f2()).to.equal(2);
      expect(await rule.m_f3()).to.equal(3);
      expect(await rule.m_land()).to.equal(0);
      expect(await rule.m_sea()).to.equal(1);
    });

    // it("Kiểm tra số tiền phải trả khi height = 0", async function () {
    //   const { rule } = await loadFixture(deployContract);
    //   const m_f1 = await rule.m_f1();
    //   const m_f2 = await rule.m_f2();
    //   const m_f3 = await rule.m_f3();
    //   const m_land = await rule.m_land();
    //   const m_sea = await rule.m_sea();

    //   expect((await rule.calculatePayAmount(0, m_land, m_f1))).to.equal(ethers.parseEther("1"));
    //   expect((await rule.calculatePayAmount(0, m_land, m_f2))).to.equal(ethers.parseEther("1.4"));
    //   expect((await rule.calculatePayAmount(0, m_land, m_f3))).to.equal(ethers.parseEther("3"));

    //   expect((await rule.calculatePayAmount(0, m_sea, m_f1))).to.equal(ethers.parseEther("3"));
    //   expect((await rule.calculatePayAmount(0, m_sea, m_f2))).to.equal(ethers.parseEther("1.4"));
    //   expect((await rule.calculatePayAmount(0, m_sea, m_f3))).to.equal(ethers.parseEther("1"));

    //   expect((await rule.calculatePayAmount(ethers.parseEther("1"), m_land, m_f1))).to.equal((ethers.parseEther("1") * BigInt(120)) / BigInt(100));
    //   expect((await rule.calculatePayAmount(ethers.parseEther("1"), m_land, m_f2))).to.equal((ethers.parseEther("1") * BigInt(140)) / BigInt(100));
    //   expect((await rule.calculatePayAmount(ethers.parseEther("1"), m_land, m_f3))).to.equal((ethers.parseEther("1") * BigInt(160)) / BigInt(100));

    //   expect((await rule.calculatePayAmount(ethers.parseEther("1"), m_sea, m_f1))).to.equal((ethers.parseEther("1") * BigInt(160)) / BigInt(100));
    //   expect((await rule.calculatePayAmount(ethers.parseEther("1"), m_sea, m_f2))).to.equal((ethers.parseEther("1") * BigInt(140)) / BigInt(100));
    //   expect((await rule.calculatePayAmount(ethers.parseEther("1"), m_sea, m_f3))).to.equal((ethers.parseEther("1") * BigInt(120)) / BigInt(100));
    // });
  });

  describe("OnChainClash", function () {

    it("Kiểm tra setup faction", async function () {
      const { clash } = await loadFixture(deployContract);

      expect(await clash.m_f1()).to.equal(1);
      expect(await clash.m_f2()).to.equal(2);
      expect(await clash.m_f3()).to.equal(3);
      expect(await clash.m_land()).to.equal(0);
      expect(await clash.m_sea()).to.equal(1);
    });

    it("Tạo map", async function () {
      const { clash, rule } = await loadFixture(deployContract);
      const start = Math.round(Date.now() / 1000)
      const finish = start + 10000;
      await clash.newGame(
        rule.getAddress(),
        0,
        start,
        finish,
        MAP.MapArr(),
        [{ row: 5, col: 10 }, { row: 5, col: 11 }, { row: 5, col: 12 }, { row: 5, col: 13 }],
        [{ row: 20, col: 10 }, { row: 20, col: 11 }, { row: 20, col: 12 }, { row: 20, col: 13 }],
        [{ row: 40, col: 10 }, { row: 40, col: 11 }, { row: 40, col: 12 }, { row: 40, col: 13 }]
      );
      expect(await clash.numberOfGame()).equal(1);
      const game = await clash.getGame(0);

      var cell = await clash.getCell(0, 5, 9);
      expect(cell.cellType).eq(0);
      expect(cell.faction).eq(0);
      expect(cell.height).eq(0);
      expect(cell.price).eq(0);

      cell = await clash.getCell(0, 5, 10);
      expect(cell.cellType).eq(0);
      expect(cell.faction).eq(1);
      expect(cell.height).eq(1);
      expect(cell.price).eq(0);

      cell = await clash.getCell(0, 40, 10);
      expect(cell.cellType).eq(1);
      expect(cell.faction).eq(3);
      expect(cell.height).eq(1);
      expect(cell.price).eq(0);
    })

    it("Mua một cell khi game còn chưa bắt đầu", async function () {
      const { clash, rule } = await loadFixture(deployContract);
      await NewGame(clash, rule, 10000, 1000);
      
      await expect(clash.buyCell(0, 0, 0, 1, [])).to.be.revertedWith("OnChainClash: This game have not begin")
    })

    it("Mua một cell khi game đã kết thúc", async function () {
      const { clash, rule } = await loadFixture(deployContract);
      await NewGame(clash, rule, 10, 100);

      await time.increaseTo(Date.now() + 10000)

      await expect(clash.buyCell(0, 0, 0, 1, [])).to.be.revertedWith("OnChainClash: This game has been finished")
    })

    it("Mua cell với faction sai", async function () {
      const { clash, rule } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 10000);

      await expect(clash.buyCell(0, 0, 0, 0, [])).to.be.revertedWith("OnChainClash: Wrong faction")
    })

    it("Mua một cell vào vị trí giống với faction đang mua", async function () {
      const { clash, rule } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 10000);

      await expect(clash.buyCell(0, 5, 10, 1, [])).to.be.revertedWith("OnChainClash: Invalid position")
    })

    it("Mua cell ở vị trí không hợp lệ", async function () {
      const { clash, rule } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 10000);

      await expect(clash.buyCell(0, 0, 0, 1, [])).to.be.revertedWith("OnChainClash: Invalid position")
    })

    it("Mua một cell mà không trả tiền", async function () {
      const { clash, rule } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 10000);
      await clash.setNumberOfComfirmation(0);
      await expect(clash.buyCell(0, 5, 14, 1, [])).to.be.revertedWith("OnChainClash: Wrong pay amount")
    })

    it("Mua một cell mà trả số tiền không đúng", async function () {
      const { clash, rule } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 10000);
      await clash.setNumberOfComfirmation(0);
      await expect(clash.buyCell(0, 5, 14, 1, [], {
        value: ethers.parseEther("0.0000001")
      })).to.be.revertedWith("OnChainClash: Wrong pay amount")
    })

    it("Mua cell thành công", async function () {
      const { clash, rule, owner, player1 } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 10000);

      var { cellType, height, price, faction } = await clash.getCell(0, 5, 14);
      expect(faction).eq(0)
      expect(height).eq(0)
      expect(price).eq(0)

      const p = await rule.getPayAmount(await clash.getAddress(), 0, 5, 14, 1);
      var proof = generateProof(
        signerKey1,
        ["uint", "address", "address", "uint", "uint", "uint", "uint"], 
        [CHAIN_ID, await clash.getAddress(), await owner.getAddress(), 0, 5, 14, 1]
      );
      await clash.buyCell(0, 5, 14, 1, [proof], {
        value: p[1]
      })

      var { faction, height, price } = await clash.getCell(0, 5, 14);
      console.log({
        faction,
        height,
        price
      })

      await Buy(clash, rule, player1, 0, 21, 11, 2)
    })

    it("Mua một cell vào vị trí giống faction đang muốn mua", async function () {
      const { clash, rule, owner } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 10000);

      var { cellType, height, price, faction } = await clash.getCell(0, 5, 14);
      expect(faction).eq(0)
      expect(height).eq(0)
      expect(price).eq(0)

      var p = await rule.getPayAmount(await clash.getAddress(), 0, 5, 14, 1);

      var proof = generateProof(
        signerKey1,
        ["uint", "address", "address", "uint", "uint", "uint", "uint"], 
        [CHAIN_ID, await clash.getAddress(), await owner.getAddress(), 0, 5, 14, 1]
      );

      await clash.buyCell(0, 5, 14, 1, [proof], {
        value: p[1]
      })

      var { faction, height, price } = await clash.getCell(0, 5, 14);

      expect(faction).eq(1)
      expect(height).eq(1)
      expect(price).eq(p[1])

      p = await rule.getPayAmount(await clash.getAddress(), 0, 5, 14, faction);

      await expect(clash.buyCell(0, 5, 14, 1,[proof], {
        value: ethers.parseEther("0.1")
      })).to.be.revertedWith("OnChainClash: Invalid position")
    })

    it("Mua cell ở cùng một toạ độ nhiều lần", async function () {
      const { clash, rule, player1 } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 10000, {
        faction1: [{ row: 5, col: 5 }],
        faction2: [{ row: 6, col: 5 }],
        faction3: [{ row: 7, col: 5 }]
      });

      await Buy(clash, rule, player1, 0, 5, 6, 1)
      await Buy(clash, rule, player1, 0, 5, 6, 2)

      var { faction, height } = await clash.getCell(0, 5, 6);
    })

    it("Error Count cell khi chưa kết thúc game hoặc đã quá hạn", async function () {
      const { clash, rule, owner, player1, player2 } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 1000, {
        faction1: [{ row: 5, col: 10 }],
        faction2: [{ row: 6, col: 11 }],
        faction3: [{ row: 40, col: 10 }]
      });

      await Buy(clash, rule, owner, 0, 6, 10, 1);
      await Buy(clash, rule, owner, 0, 7, 10, 1);
      await Buy(clash, rule, player1, 0, 8, 10, 1);
      await Buy(clash, rule, player2, 0, 6, 12, 2);
      await Buy(clash, rule, player2, 0, 6, 13, 2);
      await Buy(clash, rule, player1, 0, 39, 10, 3);
      await Buy(clash, rule, player1, 0, 40, 11, 3);

      await expect(
        clash.countCells(0, 64 * 64)
      ).revertedWith("OnChainClash: Cannot finish game")

      await time.increaseTo(await clash.getBlockTimestamp() + BigInt(8 * 24 * 60 * 60));

      await expect(
        clash.countCells(0, 64 * 64)
      ).revertedWith("OnChainClash: Cannot finish game")
    })

    it("Count cell thành công", async function () {
      const { clash, rule, owner, player1, player2 } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 1000, {
        faction1: [{ row: 5, col: 10 }],
        faction2: [{ row: 6, col: 11 }],
        faction3: [{ row: 40, col: 10 }]
      });

      await Buy(clash, rule, owner, 0, 6, 10, 1);
      await Buy(clash, rule, owner, 0, 7, 10, 1);
      await Buy(clash, rule, player1, 0, 8, 10, 1);
      await Buy(clash, rule, player2, 0, 6, 12, 2);
      await Buy(clash, rule, player2, 0, 6, 13, 2);
      await Buy(clash, rule, player1, 0, 39, 10, 3);
      await Buy(clash, rule, player1, 0, 40, 11, 3);

      await expect(
        clash.countCells(0, 64 * 64)
      ).revertedWith("OnChainClash: Cannot finish game")

      await time.increaseTo(await clash.getBlockTimestamp() + BigInt(1 * 24 * 60 * 60));

      await clash.countCells(0, 1)
      expect((await clash.getGameInfo(0)).countCell).eq(1)
      await clash.countCells(0, 10)
      expect((await clash.getGameInfo(0)).countCell).eq(11)
      await clash.countCells(0, 50)
      expect((await clash.getGameInfo(0)).countCell).eq(61)

      await clash.countCells(0, 500)
      expect((await clash.getGameInfo(0)).countCell).eq(561)

      await clash.countCells(0, 4096)
      await clash.countCells(0, 50)
      expect((await clash.getGameInfo(0)).countCell).eq(4096)


      expect((await clash.getGameInfo(0)).cellsFaction1).eq(4)
      expect((await clash.getGameInfo(0)).cellsFaction2).eq(3)
      expect((await clash.getGameInfo(0)).cellsFaction3).eq(3)
    })

    it("Finish game", async function () {
      const { clash, rule, owner, player1, player2 } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 1000, {
        faction1: [{ row: 5, col: 10 }],
        faction2: [{ row: 6, col: 11 }],
        faction3: [{ row: 40, col: 10 }]
      });

      await Buy(clash, rule, owner, 0, 4, 10, 1);
      await Buy(clash, rule, owner, 0, 6, 10, 1);
      await Buy(clash, rule, owner, 0, 7, 10, 1);
      await Buy(clash, rule, player1, 0, 8, 10, 1);
      await Buy(clash, rule, player2, 0, 6, 12, 2);
      await Buy(clash, rule, player2, 0, 6, 13, 2);
      await Buy(clash, rule, player1, 0, 39, 10, 3);
      await Buy(clash, rule, player1, 0, 40, 11, 3);

      await expect(
        clash.countCells(0, 64 * 64)
      ).revertedWith("OnChainClash: Cannot finish game")

      await time.increaseTo(await clash.getBlockTimestamp() + BigInt(1 * 24 * 60 * 60));

      await clash.countCells(0, 5000);
      expect((await clash.getGameInfo(0)).countCell).eq(4096)
      expect((await clash.getGameInfo(0)).cellsFaction1).eq(5)
      expect((await clash.getGameInfo(0)).cellsFaction2).eq(3)
      expect((await clash.getGameInfo(0)).cellsFaction3).eq(3)

      await clash.finishGame(0);
      expect((await clash.getGameInfo(0)).winFaction).eq(1)
    })

    it("Error claim reward", async function () {
      const { clash, rule, owner, player1, player2, player3 } = await loadFixture(deployContract);
      await NewGame(clash, rule, 100, 1000, {
        faction1: [{ row: 5, col: 10 }],
        faction2: [{ row: 6, col: 11 }],
        faction3: [{ row: 40, col: 10 }]
      });

      await expect(
        clash.claimReward(0)
      ).revertedWith("OnChainClash: Not Finished")

      await time.increaseTo(await clash.getBlockTimestamp() + BigInt(100));

      await Buy(clash, rule, player3, 0, 4, 10, 1);
      await Buy(clash, rule, player3, 0, 6, 10, 1);
      await Buy(clash, rule, player3, 0, 7, 10, 1);
      await Buy(clash, rule, player1, 0, 8, 10, 1);
      await Buy(clash, rule, player2, 0, 6, 12, 2);
      await Buy(clash, rule, player2, 0, 6, 13, 2);
      await Buy(clash, rule, player1, 0, 39, 10, 3);
      await Buy(clash, rule, player1, 0, 40, 11, 3);

      await expect(
        clash.countCells(0, 64 * 64)
      ).revertedWith("OnChainClash: Cannot finish game")

      await time.increaseTo(await clash.getBlockTimestamp() + BigInt(1 * 24 * 60 * 60));

      await clash.countCells(0, 5000);
      expect((await clash.getGameInfo(0)).countCell).eq(4096)
      expect((await clash.getGameInfo(0)).cellsFaction1).eq(5)
      expect((await clash.getGameInfo(0)).cellsFaction2).eq(3)
      expect((await clash.getGameInfo(0)).cellsFaction3).eq(3)

      await expect(
        clash.claimReward(0)
      ).revertedWith("OnChainClash: Not Finished")

      await clash.finishGame(0);

      await expect(
        clash.claimReward(1)
      ).revertedWith("OnChainClash: Wrong gameId")

      await clash.connect(player1).claimReward(0)

      await expect(
        clash.connect(player1).claimReward(0)
      ).revertedWith("OnChainClash: Claimed")
    })

    it("Kiểm tra thắng thua reward", async function () {
      const { clash, rule, owner, player1, player2, player3 } = await loadFixture(deployContract);
      await NewGame(clash, rule, 0, 1000, {
        faction1: [{ row: 5, col: 10 }],
        faction2: [{ row: 6, col: 11 }],
        faction3: [{ row: 40, col: 10 }]
      });

      await Buy(clash, rule, player3, 0, 4, 10, 1);
      await Buy(clash, rule, player3, 0, 6, 10, 1);
      await Buy(clash, rule, player3, 0, 7, 10, 1);
      await Buy(clash, rule, player1, 0, 8, 10, 1);
      await Buy(clash, rule, player2, 0, 6, 12, 2);
      await Buy(clash, rule, player2, 0, 6, 13, 2);
      await Buy(clash, rule, player1, 0, 39, 10, 3);
      await Buy(clash, rule, player1, 0, 40, 11, 3);

      await expect(
        clash.countCells(0, 64 * 64)
      ).revertedWith("OnChainClash: Cannot finish game")

      await time.increaseTo(await clash.getBlockTimestamp() + BigInt(1 * 24 * 60 * 60));

      await clash.countCells(0, 5000);
      expect((await clash.getGameInfo(0)).countCell).eq(4096)
      expect((await clash.getGameInfo(0)).cellsFaction1).eq(5)
      expect((await clash.getGameInfo(0)).cellsFaction2).eq(3)
      expect((await clash.getGameInfo(0)).cellsFaction3).eq(3)

      await clash.finishGame(0);

      expect((await clash.getGameInfo(0)).winFaction).eq(1)

      // MAP.ShowFaction(await clash.getGameInfo(0), [], [], [], null)


      var reward_player1 = await clash.calculateRewardForPlayer(0, player1.address)
      var reward_player2 = await clash.calculateRewardForPlayer(0, player2.address)
      var reward_player3 = await clash.calculateRewardForPlayer(0, player3.address)



      var binClash = await ethers.provider.getBalance(clash.getAddress())
      var reward = (await clash.getGame(0)).reward

      expect(
        reward_player1 + reward_player2 + reward_player3
      ).eq(binClash).eq(reward)

      await clash.connect(player1).claimReward(0)

      expect(
        binClash - await ethers.provider.getBalance(clash.getAddress())
      ).eq(reward_player1)

      await clash.connect(player2).claimReward(0)
      await clash.connect(player3).claimReward(0)

      expect(
        await ethers.provider.getBalance(clash.getAddress())
      ).eq(0)
    })

    it("Đánh bound", async function () {
      const { clash, rule, owner, player2, player3 } = await loadFixture(deployContract);

      await NewGame(clash, rule, 0, 1000, {
        faction1: [{ row: 5, col: 10 }],
        faction2: [{ row: 6, col: 11 }],
        faction3: [{ row: 40, col: 10 }]
      });

      await Buy(clash, rule, owner, 0, 6, 10, 1);
      await Buy(clash, rule, owner, 0, 7, 10, 1);
      await Buy(clash, rule, owner, 0, 7, 11, 1);
      await Buy(clash, rule, owner, 0, 7, 12, 1);
      await Buy(clash, rule, owner, 0, 7, 13, 1);
      await Buy(clash, rule, owner, 0, 6, 14, 1);
      await Buy(clash, rule, owner, 0, 5, 14, 1);
      await Buy(clash, rule, owner, 0, 4, 13, 1);
      await Buy(clash, rule, owner, 0, 4, 12, 1);
      await Buy(clash, rule, owner, 0, 4, 11, 1);
      // await Buy(clash, rule, owner, 0, 7, 8, 1);
      // await Buy(clash, rule, owner, 0, 8, 8, 1);
      // await Buy(clash, rule, owner, 0, 9, 8, 1);
      // await Buy(clash, rule, owner, 0, 10, 8, 1);
      // await Buy(clash, rule, owner, 0, 11, 8, 1);
      // await Buy(clash, rule, owner, 0, 11, 9, 1);
      // await Buy(clash, rule, owner, 0, 11, 10, 1);
      // await Buy(clash, rule, owner, 0, 10, 10, 1);
      // await Buy(clash, rule, owner, 0, 8, 7, 1);
      // await Buy(clash, rule, owner, 0, 9, 7, 1);

      // await Buy(clash, rule, player3, 0, 7, 10, 2);

      // await Buy(clash, rule, player3, 0, 7, 11, 2);
      // await Buy(clash, rule, player3, 0, 8, 11, 2);

      // await Buy(clash, rule, owner, 0, 9, 10, 1);
      // await Buy(clash, rule, owner, 0, 5, 12, 1);
      // await Buy(clash, rule, owner, 0, 5, 11, 1);
      // await Buy(clash, rule, player2, 0, 8, 11, 1);

      MAP.ShowFaction(
        await clash.getGameInfo(0), [], [], [], null
      )

    const $ = BigInt;

      var r4 = MAP.set1(BigInt(0), BigInt(4));
      r4 = MAP.on2(r4, BigInt(11));
      r4 = MAP.on2(r4, BigInt(12));
      r4 = MAP.on2(r4, BigInt(13));

      var r5 = MAP.set1(BigInt(0), BigInt(5));
      r5 = MAP.on2(r5, BigInt(10));
      r5 = MAP.on2(r5, BigInt(14));

      var r6 = MAP.set1(BigInt(0), BigInt(6));
      r6 = MAP.on2(r6, BigInt(10));
      r6 = MAP.on2(r6, BigInt(14));

      var r7 = MAP.set1(BigInt(0), BigInt(7));
      r7 = MAP.on2(r7, BigInt(10));
      r7 = MAP.on2(r7, BigInt(11));
      r7 = MAP.on2(r7, BigInt(12));
      r7 = MAP.on2(r7, BigInt(13));
      // r7 = MAP.on2(r7, BigInt(14));
      console.log(r4.toString(2))
      console.log(r5.toString(2))
      console.log(r6.toString(2))
      console.log(r7.toString(2))

      await Fill(clash, rule, player2, 0, 5, 12, 1, 6, [
        r4,
        r5,
        r6,
        r7
      ]);

      MAP.ShowFaction(
        await clash.getGameInfo(0), [], [], [], null
      )

      await time.increaseTo(await clash.getBlockTimestamp() + BigInt(1 * 24 * 60 * 60));

      await clash.countCells(0, 5000);
      expect((await clash.getGameInfo(0)).countCell).eq(4096)

      await clash.finishGame(0);

      expect((await clash.getGameInfo(0)).winFaction).eq(1)

      // MAP.ShowFaction(
      //   await clash.getGameInfo(0), [], [], [], null
      // )
    })
    it("Đánh bound siêu rộng", async function () {
      const { clash, rule, owner, player2, player3 } = await loadFixture(deployContract);

      await NewGame(clash, rule, 0, 1000, {
        faction1: [{ row: 2, col: 2 }],
        faction2: [{ row: 6, col: 11 }],
        faction3: [{ row: 40, col: 10 }]
      });


      // MAP.ShowFaction(
      //   (await clash.getGameInfo(0)), [], [], [], {}
      // )

      for (var i = 3; i < 50; i++) {
        await Buy(clash, rule, owner, 0, i, 2, 1)
        // MAP.ShowFaction(
        //   (await clash.getGameInfo(0)), [], [], [], {}
        // )
      }
      for (var i = 3; i < 50; i++) {
        await Buy(clash, rule, owner, 0, 50, i, 1)
        // MAP.ShowFaction(
        //   (await clash.getGameInfo(0)), [], [], [], {}
        // )
      }

      for (var i = 49; i >= 0; i--) {
        await Buy(clash, rule, owner, 0, i, 50, 1)
        // MAP.ShowFaction(
        //   (await clash.getGameInfo(0)), [], [], [], {}
        // )
      }

      for (var i = 49; i >= 3; i--) {
        await Buy(clash, rule, owner, 0, 3, i, 1)
        // MAP.ShowFaction(
        //   (await clash.getGameInfo(0)), [], [], [], {}
        // )
      }

      await Fill(clash, rule, player2, 0, 4, 4, 1, 2162, []);

      MAP.ShowFaction(
        await clash.getGameInfo(0), [], [], [], null
      )

      await time.increaseTo(await clash.getBlockTimestamp() + BigInt(1 * 24 * 60 * 60));

      await clash.countCells(0, 5000);
      expect((await clash.getGameInfo(0)).countCell).eq(4096)

      await clash.finishGame(0);

      expect((await clash.getGameInfo(0)).winFaction).eq(1)

      MAP.ShowFaction(
        await clash.getGameInfo(0), [], [], [], null
      )
    })
  });
});
