multiversx_sc::imports!();
multiversx_sc::derive_imports!();

use smart_account::{
    config::{MAX_PERCENTAGE, MAX_RISK_TOLERANCE},
    PositionType, Strategy,
};

use crate::config;

const MAX_STRATEGIES_NO: usize = 5;

#[multiversx_sc::module]
pub trait StrategiesModule: config::ConfigModule {
    #[endpoint(setStrategiesPerEpoch)]
    fn set_strategies_per_epoch(
        &self,
        risk_tolerance: u64,
        risk_strategies: MultiValueEncoded<
            MultiValue4<u64, PositionType, ManagedAddress, TokenIdentifier>,
        >,
    ) {
        let current_epoch = self.blockchain().get_block_epoch();
        let caller = self.blockchain().get_caller();
        let admin = self.admin_address().get();
        require!(caller == admin, "Only admin can update the strategies");
        require!(
            risk_strategies.len() <= MAX_STRATEGIES_NO,
            "Too many strategies defined"
        );

        let strategies_mapper = self.strategies(current_epoch, risk_tolerance);
        require!(
            risk_tolerance <= MAX_RISK_TOLERANCE,
            "Incorrect risk tolerance"
        );
        require!(strategies_mapper.is_empty(), "Strategy already set");

        let mut total_percentage: u64 = 0;
        let mut strategies = ManagedVec::new();
        for strategy in risk_strategies {
            let (percentage, position_type, contract_address, output_token_id) =
                strategy.into_tuple();

            if percentage == 0 {
                continue;
            }

            strategies.push(Strategy {
                percentage,
                position_type,
                contract_address,
                output_token_id,
            });
            total_percentage += percentage;
        }

        require!(
            total_percentage == MAX_PERCENTAGE,
            "Invalid total percentage"
        );

        self.strategies(current_epoch, risk_tolerance)
            .set(strategies);
        self.last_strategy_epoch().set(current_epoch);
    }

    #[view(getStrategies)]
    #[storage_mapper("strategies")]
    fn strategies(
        &self,
        epoch: u64,
        risk_tolerance: u64,
    ) -> SingleValueMapper<ManagedVec<Strategy<Self::Api>>>;

    #[view(getLastStrategyEpoch)]
    #[storage_mapper("lastStrategyEpoch")]
    fn last_strategy_epoch(&self) -> SingleValueMapper<u64>;
}
