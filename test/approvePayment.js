import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("approvePayment", function () {

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


        Escrow = await ethers.getContractFactory("Escrow");


        escrow = await Escrow.deploy(
            owner.address,
            PLATFORM_FEE
        );


        await escrow.waitForDeployment();

    });


    async function getDeadline() {

        const block = await ethers.provider.getBlock("latest");

        return block.timestamp + 3600;

    }
        async function createDeliveredEscrow(){

        const deadline = await getDeadline();


        await escrow.connect(buyer)
        .createEscrow(
            seller.address,
            arbitrator.address,
            AMOUNT,
            deadline
        );


        await escrow.connect(buyer)
        .fundEscrow(0,{
            value: AMOUNT
        });


        await escrow.connect(seller)
        .acceptEscrow(0);


        await escrow.connect(seller)
        .markDelivered(0);

    }


    it("should approve payment successfully", async function(){

    await createDeliveredEscrow();


    await escrow.connect(buyer)
    .approvePayment(0);


    const data =
        await escrow.getEscrow(0);


    expect(data.status).to.equal(4n);

});



it("should increase accumulated fees after approval", async function(){

    await createDeliveredEscrow();

    await escrow.connect(buyer)
    .approvePayment(0);


    const fees =
        await escrow.accumulatedFees();


    expect(fees)
    .to.equal(
        ethers.parseEther("0.025")
    );

});





it("should reduce total locked funds after approval", async function(){

    await createDeliveredEscrow();

    await escrow.connect(buyer)
    .approvePayment(0);


    const locked =
        await escrow.totalLockedFunds();


    expect(locked)
    .to.equal(0);

});



it ("should revert if escrow is already delivered", async function () {
     const deadline = await  getDeadline();

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

     await escrow.connect(seller).markDelivered(0);


     await expect (escrow.connect(seller).markDelivered(0))
     .to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus"
     );
    
});



it("should revert if non buyer approves payment", async function(){

    await createDeliveredEscrow();


    await expect(
        escrow.connect(seller)
        .approvePayment(0)
    )
    .to.be.revertedWithCustomError(
        escrow,
        "NotBuyer"
    );

});



it("should emit payment released event", async function(){

    await createDeliveredEscrow();


    await expect(
        escrow.connect(buyer)
        .approvePayment(0)
    )
    .to.emit(
        escrow,
        "PaymentReleased"
    );

});







});