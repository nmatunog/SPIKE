/**
 * @deprecated Import from `../services/portfolioGenerator.js` — kept for backward compatibility.
 */
export {
  buildVenturePortfolio,
  generateVenturePortfolio,
  isVenturePortfolioReady,
  PORTFOLIO_NAV_SECTIONS,
  AGENCY_CAREER_ROADMAP,
  SPECIALIST_CAREER_ROADMAP,
} from '../services/portfolioGenerator.js';

import { DREAM_BOARD_CATEGORIES } from './day1BuilderConstants.js';

/** @param {string} categoryId */
export function dreamBoardCategoryMeta(categoryId) {
  return DREAM_BOARD_CATEGORIES.find((category) => category.id === categoryId) ?? {
    id: categoryId,
    label: categoryId,
    color: 'bg-white border-slate-200',
  };
}
