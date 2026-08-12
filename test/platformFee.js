import { expect } from "chai";
import { network } from "hardhat";

const { ethers, provider } = await network.connect();


describe("Platform Fee", function () {

    let escrow;
    let owner;
    let buyer;
    let seller;
    let arbitrator;


    beforeEach(async function () {

        [
            owner,
            buyer,
            seller,
            arbitrator
        ] = await ethers.getSigners();


        const Escrow =
            await ethers.getContractFactory("Escrow");


        escrow =
            await Escrow.deploy(
                owner.address,
                250
            );


        await escrow.waitForDeployment();

    });



    it("should set initial platform fee correctly", async function () {

        expect(
            await escrow.platformFee()
        )
        .to.equal(250);

    });



    it("should revert if proposing same platform fee", async function(){

        await expect(
            escrow
            .connect(owner)
            .proposePlatformFee(250)

        )
        .to.be.revertedWithCustomError(
            escrow,
            "PlatformFeeUnchanged"
        );

    });



    it("should store pending fee correctly", async function(){

        await escrow
        .connect(owner)
        .proposePlatformFee(700);


        expect(
            await escrow.pendingFee()
        )
        .to.equal(700);

    });



    it("should set fee unlock timestamp", async function(){

        await escrow
        .connect(owner)
        .proposePlatformFee(500);


        const unlockTime =
            await escrow.feeChangeUnlockTime();


        expect(unlockTime)
        .to.be.gt(0);

    });



    it("should keep old fee before execution", async function(){

        await escrow.proposePlatformFee(500);


        expect(
            await escrow.platformFee()
        )
        .to.equal(250);

    });



    it("should clear pending fee after execution", async function(){

        await escrow
        .connect(owner)
        .proposePlatformFee(500);


        await provider.send(
            "evm_increaseTime",
            [2 * 24 * 60 * 60]
        );


        await provider.send(
            "evm_mine"
        );


        await escrow.executePlatformFee();


        expect(
            await escrow.pendingFee()
        )
        .to.equal(0);


        expect(
            await escrow.feeChangeUnlockTime()
        )
        .to.equal(0);

    });



    it("should allow maximum fee", async function () {


        await escrow
        .connect(owner)
        .proposePlatformFee(1000);


        expect(
            await escrow.pendingFee()
        )
        .to.equal(1000);

    });


});