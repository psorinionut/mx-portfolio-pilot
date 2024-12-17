multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::module]
pub trait ConfigModule {
    #[only_owner]
    #[endpoint(setFarmStakingAddressForToken)]
    fn set_farm_staking_address_for_token(
        &self,
        token_id: TokenIdentifier,
        staking_address: ManagedAddress,
    ) {
        require!(
            self.blockchain().is_smart_contract(&staking_address),
            "Address must be a smart contract"
        );

        self.farm_staking_address_for_token(&token_id)
            .set(staking_address);
    }

    #[only_owner]
    #[endpoint(setAdminAddress)]
    fn set_admin_address(&self, admin_address: ManagedAddress) {
        require!(!admin_address.is_zero(), "Incorrect admin address");

        self.admin_address().set(admin_address);
    }

    fn get_default_code_metadata(&self) -> CodeMetadata {
        CodeMetadata::UPGRADEABLE | CodeMetadata::READABLE
    }

    #[view(getUserSmartAccount)]
    #[storage_mapper("userSmartAccount")]
    fn user_smart_account(&self, user: ManagedAddress) -> SingleValueMapper<ManagedAddress>;

    #[view(getAdminAddress)]
    #[storage_mapper("adminAddress")]
    fn admin_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[view(getSmartAccountOpenFee)]
    #[storage_mapper("smartAccountOpenFee")]
    fn smart_account_open_fee(&self) -> SingleValueMapper<BigUint>;

    #[view(getSmartAccountTemplateAddress)]
    #[storage_mapper("smartAccountTemplateAddress")]
    fn smart_account_template_address(&self) -> SingleValueMapper<ManagedAddress>;

    // external settings
    #[storage_mapper("farmStakingAddressForToken")]
    fn farm_staking_address_for_token(
        &self,
        token_id: &TokenIdentifier,
    ) -> SingleValueMapper<ManagedAddress>;
}
