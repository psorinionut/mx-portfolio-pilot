multiversx_sc::imports!();

use common_structs::PaymentsVec;
use farm::{
    base_functions::{ExitFarmResultType, ExitFarmResultWrapper},
    EnterFarmResultType,
};
use multiversx_sc::storage::StorageKey;

pub static PAIR_CONTRACT_ADDRESS_STORAGE_KEY: &[u8] = b"pair_contract_address";

pub struct EnterFarmResultWrapper<M: ManagedTypeApi> {
    pub new_farm_token: EsdtTokenPayment<M>,
    pub rewards: EsdtTokenPayment<M>,
}

#[multiversx_sc::module]
pub trait FarmActionsModule {
    fn call_enter_farm(
        &self,
        farm_address: ManagedAddress,
        tokens: PaymentsVec<Self::Api>,
    ) -> EnterFarmResultWrapper<Self::Api> {
        let raw_results: EnterFarmResultType<Self::Api> = self
            .farm_proxy(farm_address)
            .enter_farm_endpoint(OptionalValue::<ManagedAddress>::None)
            .with_multi_token_transfer(tokens)
            .execute_on_dest_context();

        let (new_farm_token, rewards) = raw_results.into_tuple();
        EnterFarmResultWrapper {
            new_farm_token,
            rewards,
        }
    }

    fn call_exit_farm(
        &self,
        farm_address: ManagedAddress,
        user: ManagedAddress,
        farm_tokens: EsdtTokenPayment,
    ) -> ExitFarmResultWrapper<Self::Api> {
        let raw_results: ExitFarmResultType<Self::Api> = self
            .farm_proxy(farm_address)
            .exit_farm_endpoint(OptionalValue::Some(user))
            .with_esdt_transfer(farm_tokens)
            .execute_on_dest_context();
        let (farming_tokens, rewards) = raw_results.into_tuple();

        ExitFarmResultWrapper {
            farming_tokens,
            rewards,
        }
    }

    fn get_farm_pair_contract_address_mapper(
        &self,
        sc_address: ManagedAddress,
    ) -> SingleValueMapper<ManagedAddress, ManagedAddress> {
        SingleValueMapper::<_, _, ManagedAddress>::new_from_address(
            sc_address,
            StorageKey::new(PAIR_CONTRACT_ADDRESS_STORAGE_KEY),
        )
    }
    
    #[proxy]
    fn farm_proxy(&self, sc_address: ManagedAddress) -> farm_with_locked_rewards::Proxy<Self::Api>;
}
