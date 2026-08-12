import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("acceptEscrow", function () {

    let Escrow;
    let escrow;

    let owner;
    let buyer;
    let seller;
    let arbitrator;
    let other;

    const PLATFORM_FEE = 250;
    const AMOUNT = ethers.parseEther("1");

    beforeEach(async function () {

        [owner, buyer, seller, arbitrator, other] =
            await ethers.getSigners();

        Escrow =
            await ethers.getContractFactory("Escrow");

        escrow =
            await Escrow.deploy(
                owner.address,
                PLATFORM_FEE
            );

        await escrow.waitForDeployment();

    });

    async function getDeadline() {

        const block =
            await ethers.provider.getBlock("latest");

        return block.timestamp + 3600;

    }

    describe("Success", function () {

     it("should accept escrow carefully",async function() {
        const deadline =await getDeadline();
        await escrow.connect(buyer).createEscrow(
            seller.address,
            arbitrator.address,
            AMOUNT,
            deadline
        );
        await escrow.connect(buyer).fundEscrow(0,{
            value : AMOUNT
        });
        await escrow.connect(seller).acceptEscrow(0);
        const info = await escrow.getEscrow(0);
        expect(info.status).to.equal(2n);
        
     }) ;


      it("should emit escrowAccepted event",async function() {
        const deadline =await getDeadline();
        await escrow.connect(buyer).createEscrow(
            seller.address,
            arbitrator.address,
            AMOUNT,
            deadline
        );
        await escrow.connect(buyer).fundEscrow(0,{
            value : AMOUNT
        });

        await expect ( escrow.connect(seller).acceptEscrow(0)
    ).to.emit(escrow,"EscrowAccepted").withArgs(
        0,seller.address
    );
     }) ;




     it("should update status to accepted", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );

    await escrow.connect(buyer).fundEscrow(0, {
        value: AMOUNT
    });

    await escrow.connect(seller).acceptEscrow(0);

    const escrowData = await escrow.getEscrow(0);
    expect(escrowData.status).to.equal(2);

});









    });

    describe("Failure", function () {







    it("Should revert if escrow does not exist", async function () {

    await expect(
        escrow.connect(seller).acceptEscrow(0)
    ).to.be.revertedWithCustomError(
        escrow,
        "EscrowNotFound"
    );

   });


   it("should revert if escrow is not funded",async function(){
      await expect(
        escrow.connect(seller).fundEscrow(0)
    ).to.be.revertedWithCustomError(
        escrow,
        "EscrowNotFound"
    );


   });




   it("Should revert if deadline has passed", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );

    await escrow.connect(buyer).fundEscrow(0, {
        value: AMOUNT
    });

    
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    await expect(
        escrow.connect(seller).acceptEscrow(0)
    ).to.be.revertedWithCustomError(
        escrow,
        "DeadlinePassed"
    );

});


it("should revert if non seller accept escrow", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );

    await escrow.connect(buyer).fundEscrow(0, {
        value: AMOUNT
    });

    await expect(
        escrow.connect(buyer).acceptEscrow(0)
    ).to.be.revertedWithCustomError(
        escrow,
        "NotSeller"
    );

});




it("should revert if escrow is already accepted", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );

    await escrow.connect(buyer).fundEscrow(0, {
        value: AMOUNT
    });

    await escrow.connect(seller).acceptEscrow(0);

    await expect(
        escrow.connect(seller).acceptEscrow(0)
    ).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus"
    );

});



it("should revert if arbitrator accepts escrow", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );

    await escrow.connect(buyer).fundEscrow(0, {
        value: AMOUNT
    });

    await escrow.connect(seller).acceptEscrow(0);

    await expect(
        escrow.connect(arbitrator).acceptEscrow(0)
    ).to.be.revertedWithCustomError(
        escrow,
        "NotSeller"
    );

});







        

    });

});