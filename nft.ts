import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  mintTo,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";

// Function to create and initialize an NFT
async function createNFT() {
  // Establish a connection to the Devnet cluster
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Access the default payer provided by Solana Playground
  const payer = pg.wallet.keypair;

  // Generate a new Keypair for the Mint Account
  const mintKeypair = Keypair.generate();
  const mintPublicKey = mintKeypair.publicKey;

  // Define the number of decimals for the token
  const decimals = 0; // Set to 0 for NFTs

  // Get the minimum lamports required for rent exemption for the Mint Account
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  // Create a transaction to create and initialize the Mint Account
  const transaction = new Transaction().add(
    // Create the Mint Account
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintPublicKey,
      space: 82, // Size of the Mint Account
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    // Initialize the Mint Account with decimals set to 0
    createInitializeMintInstruction(
      mintPublicKey,
      decimals,
      payer.publicKey, // Mint Authority
      payer.publicKey // Freeze Authority (optional)
    )
  );

  // Send the transaction to the network
  await sendAndConfirmTransaction(connection, transaction, [
    payer,
    mintKeypair,
  ]);

  console.log(`Mint Account created: ${mintPublicKey.toBase58()}`);

  // Get the Associated Token Account (ATA) for the payer
  const ata = await getAssociatedTokenAddress(
    mintPublicKey, // Mint
    payer.publicKey // Owner
  );

  // Create the ATA if it doesn't exist
  const ataTransaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey, // Payer
      ata, // ATA
      payer.publicKey, // Owner
      mintPublicKey // Mint
    )
  );

  // Send the transaction to create the ATA
  await sendAndConfirmTransaction(connection, ataTransaction, [payer]);

  console.log(`Associated Token Account created: ${ata.toBase58()}`);

  // Mint tokens to the ATA
  const amount = 1; // Mint only 1 token for NFT
  await mintTo(
    connection,
    payer, // Payer
    mintPublicKey, // Mint
    ata, // Destination ATA
    payer, // Authority
    amount
  );

  console.log(`Minted ${amount} token to ATA: ${ata.toBase58()}`);

  // Disable future minting by removing the mint authority
  const disableMintAuthorityTx = new Transaction().add(
    // Correct parameter order: authorityType before newAuthority
    createSetAuthorityInstruction(
      mintPublicKey, // The mint account
      payer.publicKey, // Current authority
      AuthorityType.MintTokens, // Authority type to change
      null // New authority (null to disable)
    )
  );

  // Send the transaction to disable minting
  await sendAndConfirmTransaction(connection, disableMintAuthorityTx, [payer]);

  console.log(
    `Mint authority has been disabled. This token is now non-fungible.`
  );
}

// Execute the function
createNFT().catch((error) => {
  console.error("Error creating NFT:", error);
});
