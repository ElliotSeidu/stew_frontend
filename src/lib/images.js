// Food photography sourced from Wikimedia Commons under Creative Commons licences.
// Each entry keeps the author, licence and source page so the attribution stays auditable.
// See /app/legal/credits for the user-facing list. If you swap an image, update BOTH the
// file in public/foods/ and its credit entry here, then run scripts/fetch-food-images.ps1.
export const FOOD_IMAGES = {
  m1: 'palm-nut-soup.jpg',
  m2: 'groundnut-soup.jpg',
  m3: 'light-soup.jpg',
  m4: 'kontomire-stew.jpg',
  m5: 'groundnut-soup.jpg',
  m6: 'palm-nut-soup.jpg',
  m7: 'chicken-stew.jpg',
  m8: 'beef-stew.jpg',
  m9: 'fish-stew.jpg',
  m10: 'egg-stew.jpg',
  m11: 'fufu.jpg',
  m12: 'banku.jpg',
  m13: 'kenkey.jpg',
  m14: 'rice-balls.jpg',
  m15: 'sobolo.jpg',
  m16: 'pineapple-juice.jpg',
}

export const imageFor = (mealId) => (FOOD_IMAGES[mealId] ? `/foods/${FOOD_IMAGES[mealId]}` : null)

export const IMAGE_CREDITS = [
  {
    file: 'palm-nut-soup.jpg',
    dish: 'Fufu with palm nut soup and chicken',
    author: 'Perfect35',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Fufu_with_palmnut_soup_and_chicken.jpg',
  },
  {
    file: 'groundnut-soup.jpg',
    dish: 'Fufu with groundnut soup',
    author: 'Umuhiera',
    licence: 'CC0 1.0 (public domain dedication)',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Fufu_with_groundnut_soup_1.jpg',
  },
  {
    file: 'light-soup.jpg',
    dish: 'Fufu and light soup in asanka',
    author: 'daSupremo',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Fufu_and_light_soup_in_asanka.jpg',
  },
  {
    file: 'kontomire-stew.jpg',
    dish: 'Kontomire stew',
    author: 'daSupremo',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Kontomire_stew.jpg',
  },
  {
    file: 'chicken-stew.jpg',
    dish: 'Rice and stew with chicken',
    author: 'Quami43',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Ghanaian_Cuisine_01.jpg',
  },
  {
    file: 'beef-stew.jpg',
    dish: 'Boiled plantain with kontomire stew',
    author: 'Paul Tagoe',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Boiled_plantain_with_kontomire_stew,_garnished_with_pear.jpg',
  },
  {
    file: 'fish-stew.jpg',
    dish: 'Kontomire stew with eggs and plantain',
    author: 'Robertjamal12',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Kontomire_Stew,_Eggs_and_Plantian.jpg',
  },
  {
    file: 'egg-stew.jpg',
    dish: 'Palava sauce with cocoyam leaf',
    author: 'benketaro',
    licence: 'CC BY 2.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Palava_sauce_w-_cocoyam_leaf_(5612472154).jpg',
  },
  {
    file: 'fufu.jpg',
    dish: 'Fufu (plantain)',
    author: 'ZELSC',
    licence: 'CC0 1.0 (public domain dedication)',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Fufu_plantain_Ghana_1.jpg',
  },
  {
    file: 'banku.jpg',
    dish: 'Banku with tilapia',
    author: 'Umuhiera',
    licence: 'CC0 1.0 (public domain dedication)',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Banku_and_tilapia_1.jpg',
  },
  {
    file: 'kenkey.jpg',
    dish: 'Fante kenkey with fish',
    author: 'Rberchie',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Fanti_Kenkey_and_fish.jpg',
  },
  {
    file: 'rice-balls.jpg',
    dish: 'Omo tuo (rice balls) with groundnut soup',
    author: 'daSupremo',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Omo_tuo_with_groundnut_soup_and_meat.jpg',
  },
  {
    file: 'sobolo.jpg',
    dish: 'Sobolo (hibiscus drink)',
    author: 'Noahalorwu',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Sobolo.jpg',
  },
  {
    file: 'pineapple-juice.jpg',
    dish: 'Pineapple juice',
    author: 'Pixabay contributor (via Wikimedia Commons)',
    licence: 'CC0 1.0 (public domain dedication)',
    licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Pineapple_Juice_fruits-465832.jpg',
  },
]

export const CREDIT_NOTE =
  'Photos are resized copies of the originals and are used under the licences shown. No other changes were made. These are dish photos, not photographs of the specific pot a kitchen on STEW is selling.'
