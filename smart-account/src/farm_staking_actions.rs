multiversx_sc::imports!();

use common_structs::PaymentsVec;
use farm::EnterFarmResultType;
use farm_staking::stake_farm::ProxyTrait as OtherProxyTrait;
use multiversx_sc::storage::StorageKey;

use crate::config;

pub static FARM_STAKING_ADDRESS_STORAGE_KEY: &[u8] = b"farmStakingAddressForToken";

#[multiversx_sc::module]
pub trait FarmStakingActionsModule: config::ConfigModule {
    fn call_farm_staking_stake(
        &self,
        sc_address: ManagedAddress,
        tokens: PaymentsVec<Self::Api>,
    ) -> EnterFarmResultType<Self::Api> {
        self.farm_staking_proxy(sc_address)
            .stake_farm_endpoint(OptionalValue::<ManagedAddress>::None)
            .with_multi_token_transfer(tokens)
            .execute_on_dest_context()
    }

    fn get_farm_staking_address_mapper(
        &self,
        token_id: &TokenIdentifier,
    ) -> SingleValueMapper<ManagedAddress, ManagedAddress> {
        let deployer_sc = self.smart_account_deployer_address().get();
        let mut storage_key = StorageKey::new(FARM_STAKING_ADDRESS_STORAGE_KEY);
        storage_key.append_item(&token_id);

        SingleValueMapper::<_, _, ManagedAddress>::new_from_address(deployer_sc, storage_key)
    }

    #[proxy]
    fn farm_staking_proxy(&self, sc_address: ManagedAddress) -> farm_staking::Proxy<Self::Api>;

    #[storage_mapper("farmStakingAddressForToken")]
    fn farm_staking_address_for_token(
        &self,
        token_id: &TokenIdentifier,
    ) -> SingleValueMapper<ManagedAddress>;
}
