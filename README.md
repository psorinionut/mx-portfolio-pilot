# DeFi Portfolio Manager Smart Contracts

## Abstract

The DeFi Portfolio Manager is a system of smart contracts designed to automate and optimize DeFi investments on the MultiversX blockchain. It consists of two main components: a Smart Account Deployer and individual Smart Account contracts for each user, allowing for personalized portfolio management based on risk tolerance.

## Introduction

This system enables users to deploy their own Smart Account contracts and manage DeFi positions across multiple protocols with automated rebalancing based on AI-driven strategies. The system supports various position types including simple token holdings, staking, liquidity provision, and farming.

## Deployment and Usage Flow

### 1. Initial Setup
1. Deploy Smart Account Template Contract
   - This serves as the blueprint for all user Smart Accounts
   - Contains all the logic for position management and portfolio operations

2. Deploy Smart Account Deployer Contract
   ```rust
   #[init]
   fn init(
       &self,
       smart_account_open_fee: BigUint,
       admin_address: ManagedAddress,
       smart_account_template_address: ManagedAddress, // Address of deployed template
       egld_wrapper_address: ManagedAddress,
   );
   ```
   - Uses the template address for future Smart Account deployments
   - Sets up admin controls and deployment fees

### 2. Strategy Configuration
Admin configures available strategies in the Deployer contract:
```rust
#[endpoint(setStrategiesPerEpoch)]
fn set_strategies_per_epoch(
    &self,
    risk_tolerance: u64,
    risk_strategies: MultiValueEncoded<
        MultiValue4<u64, PositionType, ManagedAddress, TokenIdentifier>
    >,
);
```
- Defines strategies for each risk tolerance level (1-5)
- Sets allocation percentages and position types
- Configures protocol addresses and tokens

### 3. User Flow
1. Deploy Personal Smart Account
   ```rust
   #[payable("EGLD")]
   #[endpoint(deploySmartAccount)]
   fn deploy_smart_account(&self) -> ManagedAddress;
   ```
   - User pays the deployment fee
   - Receives their personal Smart Account address

2. Initialize Smart Account
   ```rust
   #[payable("EGLD")]
   #[endpoint(initializeSmartAccount)]
   fn initialize_smart_account(&self, risk_tolerance: u64);
   ```
   - User selects their risk tolerance
   - Deposits EGLD for investment
   - Smart Account automatically distributes funds according to the strategy

### 4. Position Creation
The Smart Account processes the strategy steps in sequence:
1. ESDT Positions
   - Direct token swaps and holds
2. Staking Positions
   - Token swaps followed by staking
3. LP Positions
   - Token swaps and liquidity provision
4. Farm Positions
   - LP token creation and farm entry

## Smart Account Deployer

### Main Features
- Deploys individual Smart Account contracts for users
- Manages strategy updates based on risk tolerance
- Handles Smart Account template upgrades
- Controls access through admin functionality

## Smart Account

### Position Types
- ESDT: Simple token holdings
- Staking: Staked positions
- LP: Liquidity provider positions
- Farm: Yield farming positions

### Storage
- user_strategy: Stores the current strategy configuration
- user_portfolio: Maintains the list of active positions
- user_risk_tolerance: Stores the user's risk preference level

## Strategy Management

### Structure
Strategies are defined per risk tolerance level (1-5) and consist of:
- Percentage allocation
- Position type (ESDT/Staking/LP/Farm)
- Contract address for interaction
- Output token identifier

### Constraints
- Maximum 5 positions per portfolio
- Total allocation must equal 100%
- Risk tolerance levels from 1 to 5

## Security Considerations

- Public endpoints have strict validation
- Admin-only functions for strategy updates
- Safe math operations for calculations

## Future Improvements

- Enhanced rebalancing mechanics
- Additional position types
- Optimized gas usage
- Extended analytics capabilities