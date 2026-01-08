# Dark Arena

**The ultimate turn-based battle royale on PulseChain**

Dark Arena is a tactical blockchain game where players use their FuelCell NFTs to enter strategic space battles. Fight on an 8x8 grid, survive the shrinking zone, and compete for DARK token prizes.

## 🎮 Features

- **NFT-Gated Entry**: Use your FuelCell NFTs to play
- **Journey-Based Ship Classes**: Your NFT's journey ID determines ship rarity
- **Turn-Based Combat**: Strategic grid-based battles
- **Shrinking Zone**: Battle royale-style danger zone
- **Prize Pool**: Top 3 survivors split DARK tokens (50%/30%/20%)
- **5-16 Players**: Flexible game sizes

## 🏗️ Project Structure

```
darkGame/
├── contracts/          # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── DarkArena.sol
│   │   ├── interfaces/
│   │   └── libraries/
│   └── test/
└── frontend/          # Next.js Web3 frontend
    ├── app/
    ├── components/
    └── lib/
```

## 🚀 Quick Start

### Smart Contracts
```bash
cd contracts
forge install
forge build
forge test
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔗 Links

- **FuelCell NFT**: 0xb18D8af16f3Ef44B790d214AB4e3a42Dfe8c3c34
- **Dark Token**: 0x1578F4De7fCb3Ac9e8925ac690228EDcA3BBc7c5
- **Network**: PulseChain (Chain ID: 369)

---

**Built on PulseChain • Powered by FuelCell NFTs**
