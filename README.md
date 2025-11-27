# CalcTrading

A comprehensive trading and personal finance calculator web application built with SvelteKit 2, Svelte 5, and Tailwind CSS 4.

## Features

### Trading Calculators
- **Profit/Loss Calculator** - Calculate profit or loss from trades
- **Risk/Reward Calculator** - Calculate R:R ratio from entry, stop loss, and take profit
- **Position Size Calculator** - Calculate position size based on risk percentage
- **Fee Calculator** - Calculate trading fees with leverage support
- **DCA Calculator** - Calculate dollar cost average for multiple entries
- **Compound Interest Calculator** - Calculate compound growth over periods

### Personal Finance Calculators
- **Loan Calculator** - Calculate loan payments, interest, and amortization schedule
- **Retirement Calculator** - Plan retirement savings and estimate monthly contributions
- **Emergency Fund Calculator** - Calculate emergency savings needs based on job stability
- **Savings Goal Calculator** - Calculate time to reach savings goal or monthly contribution needed
- **Salary Converter** - Convert between hourly, daily, monthly, and annual rates
- **Net Worth Calculator** - Calculate total net worth (assets minus liabilities)
- **Thai Tax Calculator** - Calculate Thai personal income tax (PND 90/91) with all deductions

## Tech Stack

- **Framework**: SvelteKit 2.48
- **UI Library**: Svelte 5
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **i18n**: svelte-i18n (English & Thai)
- **Build Tool**: Vite 7

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd calc-trading-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Run svelte-check for type checking |

## Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable components
│   └── i18n/
│       └── locales/    # Translation files (en.json, th.json)
└── routes/
    ├── +page.svelte    # Homepage with calculator grid
    └── calculators/    # Calculator pages
        ├── profit-loss/
        ├── risk-reward/
        ├── position-size/
        ├── fee/
        ├── dca/
        ├── compound/
        ├── loan/
        ├── retirement/
        ├── emergency-fund/
        ├── savings-goal/
        ├── salary-convert/
        ├── net-worth/
        └── tax-th/
```

## Internationalization

The app supports both English and Thai languages. Users can switch languages using the toggle button in the top-right corner. Language preference is persisted in localStorage.

## License

MIT
