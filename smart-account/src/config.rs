multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub const MAX_PERCENTAGE: u64 = 10_000;
pub const MAX_RISK_TOLERANCE: u64 = 5;

#[multiversx_sc::module]
pub trait ConfigModule {
    #[storage_mapper("smartAccountDeployerAddress")]
    fn smart_account_deployer_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("routerAddress")]
    fn router_address(&self) -> SingleValueMapper<ManagedAddress>;
}
