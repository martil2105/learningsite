/*
  One small island economy and one year of its trade, in euros.

  Three firms make bread from scratch: a farm grows wheat, a mill grinds it into
  flour, and a bakery bakes and sells loaves to households. The per-euro ratios
  below are the whole economy; every scenario in the article is built from them
  by src/accounts.js, and every number in the prose is re-derived from them by
  verify/check-numbers.mjs.
*/

// Households' spending on bread in the base year.
export const BREAD = 100;

// Flour per euro of bread baked, and wheat per euro of flour milled.
export const FLOUR_PER_BREAD = 0.5;
export const WHEAT_PER_FLOUR = 0.6;

// Wages per euro of each firm's sales. What is left after inputs and wages is
// profit, which is how the income approach ends up equal to value added.
export const WAGE_SHARE = { farm: 20 / 30, mill: 12 / 50, bakery: 35 / 100 };

// The events the question section asks about.
export const BIKES = 40; // households buy imported bicycles
export const UNSOLD = 20; // loaves still in the storeroom at the end of the year

// The lab: households spend BIKES on imported bicycles, and a share d of that
// money would otherwise have gone on bread.
export const D_DEFAULT = 0;

// The quarter-release example: firms import goods ahead of a tariff and stock them.
export const STOCKPILE = 40;

// Firm display names.
export const NAMES = {
  farm: "Farm",
  mill: "Mill",
  bakery: "Bakery",
  millbakery: "Mill-bakery",
  households: "Households",
  abroad: "Abroad",
};
