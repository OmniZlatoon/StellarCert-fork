#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Env, String, Symbol, Address};

#[contracttype]
pub struct Certificate {
    pub id: String,
    pub owner: Address,
    pub status: Symbol,
    pub internal_reason: String,
}

#[contracttype]
pub enum DataKey {
    Admin,
    MultisigConfig,
}

#[contracttype]
pub struct MultisigConfig {
    pub threshold: u32,
    pub signers: soroban_sdk::Vec<Address>,
}

#[contracttype]
pub struct CertificateTransfer {
    pub id: String,
    pub from: Address,
    pub to: Address,
    pub transfer_fee: u64,
}

#[contract]
pub struct CertificateContract;

#[contractimpl]
impl CertificateContract {
    /// Reissues a new certificate while atomically revoking the parent certificate to prevent coexistence.
    pub fn reissue_certificate(
        env: Env,
        admin: Address,
        original_id: String,
        new_id: String,
        new_owner: Address,
        new_metadata_uri: String,
    ) {
        admin.require_auth();

        let mut original_cert: Certificate = env
            .storage()
            .persistent()
            .get(&original_id)
            .unwrap_or_else(|| panic!("Original certificate not found"));

        if original_cert.status == Symbol::new(&env, "Revoked") {
            panic!("Cannot reissue from an already revoked certificate");
        }

        original_cert.status = Symbol::new(&env, "Revoked");
        original_cert.internal_reason = String::from_str(&env, "Superseded");
        env.storage().persistent().set(&original_id, &original_cert);

        env.events().publish(
            (Symbol::new(&env, "CertificateRevokedEvent"), original_id.clone()),
            String::from_str(&env, "Superseded"),
        );

        let new_cert = Certificate {
            id: new_id.clone(),
            owner: new_owner,
            status: Symbol::new(&env, "Active"),
            internal_reason: new_metadata_uri,
        };
        env.storage().persistent().set(&new_id, &new_cert);

        env.events().publish(
            (Symbol::new(&env, "CertificateIssuedEvent"), new_id),
            Symbol::new(&env, "Active"),
        );
    }

    /// Retrieves the multisig configuration safely by verifying the true caller's identity.
    pub fn get_multisig_config(env: Env, caller: Address) -> MultisigConfig {
        caller.require_auth();

        env.storage()
            .instance()
            .get(&DataKey::MultisigConfig)
            .unwrap_or_else(|| panic!("Multisig configuration not initialized"))
    }

    /// Completes a certificate transfer, including secure SAC token transfer for non-zero fees.
    pub fn complete_transfer(
        env: Env,
        from: Address,
        issuer: Address,
        token_address: Address,
        transfer_fee: u64,
    ) {
        from.require_auth();

        if transfer_fee > 0 {
            let token_client = token::Client::new(&env, &token_address);
            token_client.transfer(&from, &issuer, &i128::from(transfer_fee));
        }

        env.events().publish(
            (Symbol::new(&env, "TransferCompleted"), from),
            transfer_fee,
        );
    }
}

// contracts/certificate/src/lib.rs

/// Updates the expiry timestamp for a certificate after validating status and future timestamp.
pub fn set_certificate_expiry(
    env: Env,
    admin: Address,
    cert_id: String,
    new_expiry: u64,
) {
    admin.require_auth();

    // 1. Fetch certificate from persistent storage
    let mut cert: Certificate = env
        .storage()
        .persistent()
        .get(&cert_id)
        .unwrap_or_else(|| panic!("Certificate not found"));

    // 2. Guard: Ensure certificate is currently Active
    if cert.status != Symbol::new(&env, "Active") {
        panic!("Cannot update expiry on a non-active certificate");
    }

    // 3. Guard: Validate that the new expiry timestamp is strictly in the future
    let current_timestamp = env.ledger().timestamp();
    if new_expiry <= current_timestamp {
        panic!("New expiry timestamp must be greater than the current ledger timestamp");
    }

    // 4. Update expiry state and persist changes
    cert.expires_at = new_expiry;
    env.storage().persistent().set(&cert_id, &cert);

    // 5. Emit event for certificate expiry update
    env.events().publish(
        (Symbol::new(&env, "CertificateExpiryUpdated"), cert_id),
        new_expiry,
    );
}