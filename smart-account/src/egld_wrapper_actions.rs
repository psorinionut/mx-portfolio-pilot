multiversx_sc::imports!();

use multiversx_sc::storage::StorageKey;

use crate::config;
pub static EGLD_WRAPPER_STORAGE_KEY: &[u8] = b"egldWrapperAddress";
pub static WEGLD_STORAGE_KEY: &[u8] = b"wrappedEgldTokenId";

#[multiversx_sc::module]
pub trait EgldWrapperActionsModule: config::ConfigModule {
    fn call_wrap_egld(&self, egld_amount: BigUint) -> EsdtTokenPayment {
        let wrapper_sc_address = self.get_egld_wrapper_contract_address_mapper().get();
        let ((), back_transfers) = self
            .egld_wrapper_proxy(wrapper_sc_address)
            .wrap_egld()
            .with_egld_transfer(egld_amount)
            .execute_on_dest_context_with_back_transfers();

        let returned_wrapped_egld = back_transfers.esdt_payments;
        require!(
            returned_wrapped_egld.len() == 1,
            "wrap_egld should output only 1 payment"
        );

        returned_wrapped_egld.get(0)
    }

    fn get_egld_wrapper_contract_address_mapper(
        &self,
    ) -> SingleValueMapper<ManagedAddress, ManagedAddress> {
        let deployer_sc = self.smart_account_deployer_address().get();
        SingleValueMapper::<_, _, ManagedAddress>::new_from_address(
            deployer_sc,
            StorageKey::new(EGLD_WRAPPER_STORAGE_KEY),
        )
    }

    fn get_wegld_token_id(&self) -> TokenIdentifier {
        let wrapper_sc_address = self.get_egld_wrapper_contract_address_mapper().get();
        SingleValueMapper::<_, _, ManagedAddress>::new_from_address(
            wrapper_sc_address,
            StorageKey::new(WEGLD_STORAGE_KEY),
        )
        .get()
    }

    #[storage_mapper("egldWrapperAddress")]
    fn egld_wrapper_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("wrappedEgldTokenId")]
    fn wrapped_egld_token_id(&self) -> SingleValueMapper<TokenIdentifier>;

    #[proxy]
    fn egld_wrapper_proxy(
        &self,
        sc_address: ManagedAddress,
    ) -> multiversx_wegld_swap_sc::Proxy<Self::Api>;
}
