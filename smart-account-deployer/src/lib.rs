#![no_std]

multiversx_sc::imports!();

pub mod config;
pub mod strategies;

#[multiversx_sc::contract]
pub trait SmartAccountDeployer: config::ConfigModule + strategies::StrategiesModule {
    #[init]
    fn init(
        &self,
        smart_account_open_fee: BigUint,
        admin_address: ManagedAddress,
        smart_account_template_address: ManagedAddress,
        egld_wrapper_address: ManagedAddress,
    ) {
        require!(!admin_address.is_zero(), "Incorrect admin address");
        require!(
            self.blockchain()
                .is_smart_contract(&smart_account_template_address),
            "Template address is not a smart contract"
        );

        self.smart_account_open_fee().set(smart_account_open_fee);
        self.admin_address().set(admin_address);
        self.smart_account_template_address()
            .set(smart_account_template_address);
        self.egld_wrapper_address().set(egld_wrapper_address);
    }

    #[upgrade]
    fn upgrade(&self) {}

    #[endpoint(updateSmartAccountTemplate)]
    fn update_smart_account_template(&self, smart_account_template_address: ManagedAddress) {
        require!(
            self.blockchain()
                .is_smart_contract(&smart_account_template_address),
            "Template address is not a smart contract"
        );

        self.smart_account_template_address()
            .set(smart_account_template_address);
    }

    #[payable("EGLD")]
    #[endpoint(deploySmartAccount)]
    fn deploy_smart_account(&self) -> ManagedAddress {
        let caller = self.blockchain().get_caller();
        let payment_amount = self.call_value().egld_value().clone_value();
        require!(
            payment_amount == self.smart_account_open_fee().get(),
            "Invalid payment amount"
        );

        let smart_account_mapper = self.user_smart_account(caller);
        require!(
            smart_account_mapper.is_empty(),
            "User has already a smart account deployed"
        );

        let template_address = self.smart_account_template_address().get();
        let code_metadata = self.get_default_code_metadata();
        let (smart_account, _) = self
            .smart_account_template_proxy()
            .init(self.blockchain().get_sc_address())
            .deploy_from_source::<()>(&template_address, code_metadata);

        smart_account_mapper.set(&smart_account);

        let admin_address = self.admin_address().get();
        self.send().direct_egld(&admin_address, &payment_amount);

        smart_account
    }

    #[endpoint(upgradeSmartAccount)]
    fn upgrade_smart_account(&self) {
        let caller = self.blockchain().get_caller();
        let smart_account_mapper = self.user_smart_account(caller);
        require!(
            !smart_account_mapper.is_empty(),
            "User has not deployed a smart account yet"
        );

        let smart_account_address = smart_account_mapper.get();
        let template_address = self.smart_account_template_address().get();
        let gas_left = self.blockchain().get_gas_left();
        let code_metadata = self.get_default_code_metadata();

        self.send_raw().upgrade_from_source_contract(
            &smart_account_address,
            gas_left,
            &BigUint::zero(),
            &template_address,
            code_metadata,
            &ManagedArgBuffer::new(),
        );
    }

    #[payable("EGLD")]
    #[endpoint(initializeSmartAccount)]
    fn initialize_smart_account(&self, risk_tolerance: u64) {
        let caller = self.blockchain().get_caller();
        let smart_account_mapper = self.user_smart_account(caller);
        require!(
            !smart_account_mapper.is_empty(),
            "User has not deployed a smart account yet"
        );

        let payment_amount = self.call_value().egld_value().clone_value();

        // TODO
        // Check if some strategies are available
        let smart_account_address = smart_account_mapper.get();

        let last_strategy_epoch = self.last_strategy_epoch().get();
        let user_strategy = self.strategies(last_strategy_epoch, risk_tolerance).get();

        self.smart_account_proxy(smart_account_address)
            .setup_smart_account(risk_tolerance, user_strategy)
            .egld(payment_amount)
            .sync_call();
    }

    #[proxy]
    fn smart_account_proxy(&self, sc_address: ManagedAddress) -> smart_account::Proxy<Self::Api>;

    #[proxy]
    fn smart_account_template_proxy(&self) -> smart_account::Proxy<Self::Api>;
}
