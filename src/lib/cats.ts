export interface Cat {
  id: string;
  name: string;
  bio: string;
  /** Instagram handle of the real cat, without the @ */
  instagram?: string;
  /** Voice pitch multiplier for the synthesized meow */
  pitch: number;
  voice?: "meow" | "chirp" | "grunt";
}

export interface Hat {
  id: string;
  name: string;
}

export const catImage = (id: string) => `/cats/${id}.webp`;
export const hatImage = (id: string) => `/hats/${id}.webp`;

// Names and bios come from the game's English cosmetics table.
export const cats: Cat[] = [
  { id: "Capy", name: "Capy", bio: "The original Capy.", pitch: 0.7, voice: "chirp" },
  { id: "BeanTheChonk", name: "Bean the Chonk", bio: "The destroyer of lettuce and turkey. Bean, DomsMad's cat, was rescued as a kitten and nurtured into the big happy turkey devouring chonk she is today.", instagram: "DomsMad", pitch: 0.8 },
  { id: "BulkyMolly", name: "Bulky Molly", bio: "As moist as a burnt cake, Molly's only sport is running to the bowl.", instagram: "tartofrite", pitch: 0.85 },
  { id: "ChocoHanakuso", name: "Choco Hanakuso", bio: "Queen of boxes. Sometimes shares her box with insanely handsome guys.", instagram: "lovechul_02", pitch: 1.2 },
  { id: "HarkanTheRawChicken", name: "Harkan the Raw Chicken", bio: "Very jealous and hisses a lot if you touch his father, but he's a cuddle lover.", instagram: "cristobal.de.la.hoya", pitch: 1.1 },
  { id: "JuneTheFluffernaut", name: "June the Fluffernaut", bio: "Fluff that cannot be contained. Once the shedding starts, it will never stop.", instagram: "juniefluff", pitch: 1.25 },
  { id: "LilGoob", name: "Lil Goob", bio: "Fruit or fish, thy cat shall eat.", pitch: 1.35 },
  { id: "Lucy", name: "Lucy the Shrimp Slayer", bio: "Devours shrimp with unmatched fury. No seafood is safe from her relentless appetite. Lucy, the developer's own feline, has rightfully earned her title as the Shrimp Slayer.", instagram: "torjethorkildsen", pitch: 1.15 },
  { id: "MijuTheIceHunter", name: "Miju the Ice Hunter", bio: "Although an excellent hunter, he is usually found near the ice machine, waiting for the opportunity to snatch ice.", pitch: 0.95 },
  { id: "MouffTheCheeseLover", name: "Mouff the Cheese Lover", bio: "The only cat who doesn't like fish but will steal your cheese if you look the other way.", instagram: "cristobal.de.la.hoya", pitch: 1.05 },
  { id: "Ritva2000", name: "Ritva 2000", bio: "Loves you. Fluffs up when sensing cosmic presence. Speaks alien. Eats eggwhites to maintain cuteness.", instagram: "tuulajaritva", pitch: 1.5 },
  { id: "SheoTheTroublemaker", name: "Sheo the Troublemaker", bio: "Knocks stuff over when you're not looking.", pitch: 1.1 },
  { id: "TiaCat", name: "Tia", bio: "Spawns in the kitchen and steals all the chicken.", instagram: "Ibraheem_7665", pitch: 1.2 },
  { id: "TotoTheBoss", name: "Toto the Boss", bio: "In this part of town, the tuna economy runs through one feline. Any can cracked open, and he knows about it.", instagram: "khazim459", pitch: 0.75 },
  { id: "TysonCat", name: "Tyson", bio: "If you ask him to do his trick, he does a little forward roll.", instagram: "erre_efe_", pitch: 0.9 },
  { id: "WalterEugene", name: "Walter Eugene", bio: "Lover of bow ties. Legends say Walter swaps bow tie colors when no one is looking.", instagram: "Walter.eugenethescottishfold", pitch: 1.3 },
  { id: "PixelVoxelCubeCat", name: "Cube Cat", bio: "Cat without curves!", pitch: 1, voice: "chirp" },
];

export const hats: Hat[] = [
  { id: "Crown", name: "Crown" },
  { id: "PartyHat", name: "Party Hat" },
  { id: "CowboyHat", name: "Cowboy Hat" },
  { id: "PirateHat", name: "Pirate Hat" },
  { id: "VikingHelmet", name: "Viking Helmet" },
  { id: "MagicianHat", name: "Magician Hat" },
  { id: "ChefsHat", name: "Chef's Hat" },
  { id: "BunnyEarsHat", name: "Bunny Ears" },
  { id: "PropellerHat", name: "Propeller Hat" },
  { id: "Sombrero", name: "Sombrero" },
  { id: "AcademicCap", name: "Academic Cap" },
  { id: "PoliceCap", name: "Police Hat" },
  { id: "MinerHat", name: "Miner Hat" },
  { id: "PajamaHat", name: "Pajama Hat" },
  { id: "ShowerCap", name: "Shower Cap" },
  { id: "JokerHat", name: "Joker Hat" },
  { id: "BananaHat", name: "Banana Hat" },
  { id: "TysonsHat", name: "Tyson's Hat" },
  { id: "HatOrCaps", name: "Cat & Capy Cap" },
  { id: "BlondeHairHat", name: "Magic Blonde Hair" },
  { id: "LifeRingHat", name: "Life Ring" },
  { id: "Mustache", name: "Mustache" },
];
