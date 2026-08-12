import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("markDelivered", function () {

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





    it ("should mark escrow as delivered succesfully",async function(){
        const deadline = await getDeadline();
        await escrow.connect(buyer).createEscrow(
            seller.address,
            arbitrator.address,
            AMOUNT,
            deadline
        );
        await escrow.connect(buyer).fundEscrow(0,{
            value: AMOUNT
        });
        await escrow.connect(seller).acceptEscrow(0);
        await escrow.connect(seller).markDelivered(0);
         const data = await escrow.getEscrow(0);
         const STATUS_DELIVERED = 3n;
         expect(data.status).to.equal(STATUS_DELIVERED);


    });




    it("should emit work delivered event", async function(){

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );

    await escrow.connect(buyer).fundEscrow(0,{
        value: AMOUNT
    });

    await escrow.connect(seller).acceptEscrow(0);


    await expect(
        escrow.connect(seller).markDelivered(0)
    )
    .to.emit(
        escrow,
        "WorkDelivered"
    )
    .withArgs(
        0,
        seller.address
    );

});



it ("should revert if escrow do not exist",async function () {
    await expect(
        escrow.connect(seller).markDelivered(999)
    )
    .to.be.revertedWithCustomError(
        escrow,
        "EscrowNotFound"
    );
    
});






it("should revert if non seller marks delivered", async function(){

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );

    await escrow.connect(buyer).fundEscrow(0,{
        value: AMOUNT
    });

    await escrow.connect(seller).acceptEscrow(0);


    await expect(
        escrow.connect(buyer).markDelivered(0)
    )
    .to.be.revertedWithCustomError(
        escrow,
        "NotSeller"
    );

});





it ("should revert if escrow is not accepted",async function() {
     const deadline =await getDeadline();
      await escrow.connect(buyer).createEscrow(
            seller.address,
            arbitrator.address,
            AMOUNT,
            deadline
        );
        await escrow.connect(buyer).fundEscrow(0,{
            value: AMOUNT
        });
        
        await expect(escrow.connect(seller).markDelivered(0))
        .to.be.revertedWithCustomError(escrow,
            "InvalidStatus"
        );

    
});















});