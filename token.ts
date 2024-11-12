import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  mintTo,
} from "@solana/spl-token";

// Establish a connection to the Devnet cluster
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Access the default payer provided by Solana Playground
const payer = pg.wallet.keypair;

// Generate a new Keypair for the Mint Account
const mintKeypair = Keypair.generate();
const mintPublicKey = mintKeypair.publicKey;

// Define the number of decimals for the token
const decimals = 9; // Similar to SOL

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
  // Initialize the Mint Account
  createInitializeMintInstruction(
    mintPublicKey,
    decimals,
    payer.publicKey, // Mint Authority
    payer.publicKey  // Freeze Authority (optional)
  )
);

// Send the transaction to the network
await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair]);

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

// Mint tokens to the ATA
const amount = 1000 * 10 ** decimals; // Amount to mint (e.g., 1000 tokens)
await mintTo(
  connection,
  payer, // Payer
  mintPublicKey, // Mint
  ata, // Destination ATA
  payer, // Authority
  amount
);

console.log(`Minted ${amount / 10 ** decimals} tokens to ATA: ${ata.toBase58()}`);
