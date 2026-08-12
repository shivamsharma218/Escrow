import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("cancelEscrow", function () {

    let escrow;
    let owner;
    let buyer;
    let seller;
    let arbitrator;

    let escrowId;
    let amount;
    let deadline;


    beforeEach(async function () {

        [
            owner,
            buyer,
            seller,
            arbitrator
        ] = await ethers.getSigners();


        const Escrow =
            await ethers.getContractFactory(
                "Escrow"
            );


        escrow =
            await Escrow.deploy(
                owner.address,
                250 // 2.5% fee
            );


        await escrow.waitForDeployment();


        amount =
            ethers.parseEther("1");


        deadline =
            Math.floor(Date.now()/1000) + 86400;


        // create escrow
        await escrow.connect(buyer)
            .createEscrow(
                seller.address,
                arbitrator.address,
                amount,
                deadline
            );


        escrowId = 0;

    });



    it("should allow buyer to cancel unfunded escrow", async function(){


        await escrow.connect(buyer)
            .cancelEscrow(escrowId);



        const data =
            await escrow.getEscrow(
                escrowId
            );


        expect(data.status)
            .to.equal(5); 

    });




    it("arbitrator should release payment to seller", async function(){

    
    await escrow.connect(buyer)
        .fundEscrow(escrowId,{
            value: amount
        });


   
    await escrow.connect(seller)
        .acceptEscrow(escrowId);


  
    await escrow.connect(seller)
        .markDelivered(escrowId);


    
    await escrow.connect(buyer)
        .raiseDispute(escrowId);


    
    let data = await escrow.getEscrow(escrowId);

    expect(data.status)
        .to.equal(6); 


   
    await escrow.connect(arbitrator)
        .resolveDispute(
            escrowId,
            seller.address
        );


    data = await escrow.getEscrow(escrowId);

    expect(data.status)
        .to.equal(7); 


});









});