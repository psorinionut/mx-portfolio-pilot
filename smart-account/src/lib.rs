#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

use pair_actions::PairAddLiqArgs;

use crate::config::MAX_PERCENTAGE;

pub mod config;
pub mod egld_wrapper_actions;
pub mod farm_actions;
pub mod farm_staking_actions;
pub mod pair_actions;

#[derive(ManagedVecItem, TypeAbi, TopEncode, TopDecode, NestedDecode, NestedEncode)]
pub enum PositionType {
    ESDT,
    Staking,
    LP,
    Farm,
}

#[derive(ManagedVecItem, TypeAbi, TopEncode, TopDecode, NestedDecode, NestedEncode)]
pub struct Strategy<M: ManagedTypeApi> {
    pub percentage: u64,
    pub position_type: PositionType,
    pub contract_address: ManagedAddress<M>,
    pub output_token_id: TokenIdentifier<M>,
}

#[multiversx_sc::contract]
pub trait SmartAccount:
    egld_wrapper_actions::EgldWrapperActionsModule
    + pair_actions::PairActionsModule
    + farm_actions::FarmActionsModule
    + farm_staking_actions::FarmStakingActionsModule
    + config::ConfigModule
{
    #[init]
    fn init(&self, smart_account_deployer_address: ManagedAddress) {
        self.smart_account_deployer_address()
            .set(smart_account_deployer_address);
    }

    #[upgrade]
    fn upgrade(&self) {}

    #[only_owner]
    #[payable("EGLD")]
    #[endpoint(setupSmartAccount)]
    fn setup_smart_account(
        &self,
        risk_tolerance: u64,
        user_strategy: ManagedVec<Strategy<Self::Api>>,
    ) {
        let egld_payment = self.call_value().egld_value().clone_value();
        let wrapped_payment = self.call_wrap_egld(egld_payment.clone());
        let wegld_token_id = self.get_wegld_token_id();
        require!(
            wrapped_payment.token_identifier == wegld_token_id,
            "Invalid base token"
        );

        self.user_risk_tolerance().set(risk_tolerance);
        self.user_strategy().set(&user_strategy);

        for strategy_step in user_strategy.iter() {
            match strategy_step.position_type {
                PositionType::ESDT => self.process_esdt_position(&egld_payment, &strategy_step),
                PositionType::Staking => {
                    self.process_staking_position(&egld_payment, &strategy_step)
                }
                PositionType::LP => self.process_lp_position(&egld_payment, &strategy_step),
                PositionType::Farm => self.process_farm_position(&egld_payment, &strategy_step),
            }
        }
    }

    fn process_esdt_position(&self, total_amount: &BigUint, strategy_step: &Strategy<Self::Api>) {
        let wegld_token_id = self.get_wegld_token_id();
        let investment_amount = total_amount * strategy_step.percentage / MAX_PERCENTAGE;
        let output_payment = self.call_pair_swap(
            strategy_step.contract_address.clone(),
            EsdtTokenPayment::new(wegld_token_id, 0, investment_amount),
            strategy_step.output_token_id.clone(),
        );

        self.save_user_position(output_payment);
    }

    fn process_staking_position(
        &self,
        total_amount: &BigUint,
        strategy_step: &Strategy<Self::Api>,
    ) {
        let wegld_token_id = self.get_wegld_token_id();
        let investment_amount = total_amount * strategy_step.percentage / MAX_PERCENTAGE;
        let swap_output_payment = self.call_pair_swap(
            strategy_step.contract_address.clone(),
            EsdtTokenPayment::new(wegld_token_id, 0, investment_amount),
            strategy_step.output_token_id.clone(),
        );

        let farm_staking_address = self
            .get_farm_staking_address_mapper(&strategy_step.output_token_id)
            .get();

        let farm_staking_result = self.call_farm_staking_stake(
            farm_staking_address,
            ManagedVec::from_single_item(swap_output_payment),
        );

        let (new_farm_token, _boosted_rewards_payment) = farm_staking_result.into_tuple();

        self.save_user_position(new_farm_token);
    }

    fn process_lp_position(&self, total_amount: &BigUint, strategy_step: &Strategy<Self::Api>) {
        let wegld_token_id = self.get_wegld_token_id();
        let investment_amount = total_amount * strategy_step.percentage / MAX_PERCENTAGE;
        let swap_output_payment = self.call_pair_swap(
            strategy_step.contract_address.clone(),
            EsdtTokenPayment::new(wegld_token_id.clone(), 0, &investment_amount / 2u64),
            strategy_step.output_token_id.clone(),
        );

        let first_token_id = self
            .get_first_token_id_mapper(strategy_step.contract_address.clone())
            .get();
        let second_token_id = self
            .get_second_token_id_mapper(strategy_step.contract_address.clone())
            .get();

        let (first_tokens, second_tokens) = if first_token_id == wegld_token_id {
            (
                EsdtTokenPayment::new(first_token_id, 0, investment_amount / 2u64),
                EsdtTokenPayment::new(second_token_id, 0, swap_output_payment.amount),
            )
        } else {
            (
                EsdtTokenPayment::new(second_token_id, 0, swap_output_payment.amount),
                EsdtTokenPayment::new(first_token_id, 0, investment_amount / 2u64),
            )
        };

        let add_liq_args = PairAddLiqArgs {
            pair_address: strategy_step.contract_address.clone(),
            first_tokens,
            second_tokens,
            first_token_min_amount_out: BigUint::from(1u64),
            second_token_min_amount_out: BigUint::from(1u64),
        };

        let add_liquidity_result = self.call_pair_add_liquidity(add_liq_args);

        self.save_user_position(add_liquidity_result.lp_tokens);
    }

    fn process_farm_position(&self, total_amount: &BigUint, strategy_step: &Strategy<Self::Api>) {
        let wegld_token_id = self.get_wegld_token_id();
        let investment_amount = total_amount * strategy_step.percentage / MAX_PERCENTAGE;

        let pair_address = self
            .get_farm_pair_contract_address_mapper(strategy_step.contract_address.clone())
            .get();

        let swap_output_payment = self.call_pair_swap(
            pair_address.clone(),
            EsdtTokenPayment::new(wegld_token_id.clone(), 0, &investment_amount / 2u64),
            strategy_step.output_token_id.clone(),
        );

        let first_token_id = self.get_first_token_id_mapper(pair_address.clone()).get();
        let second_token_id = self.get_second_token_id_mapper(pair_address.clone()).get();

        let (first_tokens, second_tokens) = if first_token_id == wegld_token_id {
            (
                EsdtTokenPayment::new(first_token_id, 0, investment_amount / 2u64),
                EsdtTokenPayment::new(second_token_id, 0, swap_output_payment.amount),
            )
        } else {
            (
                EsdtTokenPayment::new(second_token_id, 0, swap_output_payment.amount),
                EsdtTokenPayment::new(first_token_id, 0, investment_amount / 2u64),
            )
        };

        let add_liq_args = PairAddLiqArgs {
            pair_address,
            first_tokens,
            second_tokens,
            first_token_min_amount_out: BigUint::from(1u64),
            second_token_min_amount_out: BigUint::from(1u64),
        };

        let add_liquidity_result = self.call_pair_add_liquidity(add_liq_args);

        let enter_farm_payments = ManagedVec::from_single_item(add_liquidity_result.lp_tokens);
        let enter_farm_result =
            self.call_enter_farm(strategy_step.contract_address.clone(), enter_farm_payments);

        self.save_user_position(enter_farm_result.new_farm_token);
    }

    fn save_user_position(&self, user_position: EsdtTokenPayment) {
        let user_portfolio_mapper = self.user_portfolio();

        let mut user_portfolio = if !user_portfolio_mapper.is_empty() {
            user_portfolio_mapper.get()
        } else {
            ManagedVec::new()
        };

        user_portfolio.push(user_position);
    }

    #[view(getUserStrategy)]
    #[storage_mapper("userStrategy")]
    fn user_strategy(&self) -> SingleValueMapper<ManagedVec<Strategy<Self::Api>>>;

    #[view(getUserPortfolio)]
    #[storage_mapper("userPortfolio")]
    fn user_portfolio(&self) -> SingleValueMapper<ManagedVec<EsdtTokenPayment>>;

    #[view(getUserRiskTolerance)]
    #[storage_mapper("userRiskTolerance")]
    fn user_risk_tolerance(&self) -> SingleValueMapper<u64>;
}
