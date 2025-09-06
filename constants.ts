export const MAX_ROUNDS = 10;
export const ROUND_TIMER_SECONDS = 10;
export const MAX_LINES = 1;

export const PROMPT_DIFFICULTY_LEVELS: string[][] = [
  // Level 1: Simple, iconic shapes (30 prompts)
  [
    "cat", "dog", "bird", "fish", "butterfly",
    "house", "car", "bicycle", "boat", "train",
    "tree", "flower", "leaf", "mushroom", "mountain",
    "sun", "moon", "star", "cloud", "rainbow",
    "cup", "bottle", "spoon", "chair", "table",
    "key", "lock", "ladder", "balloon", "umbrella"
  ],
  // Level 2: More detailed objects (30 prompts)
  [
    "flower with stem and leaves", "book with glasses on top", "key on a keychain", 
    "chair with a cushion", "bird on a branch", "banana peel", "heart with an arrow", 
    "bicycle with a basket", "acoustic guitar", "wizard hat", "teapot with steam", 
    "vintage camera", "old rotary telephone", "backpack with a zipper", "open umbrella", 
    "desk lamp", "a single sneaker", "ice cream cone with a scoop", "sailboat on water", 
    "fire truck with a ladder", "simple castle with towers", "lighthouse with a beam of light", 
    "windmill", "watering can", "coffee mug with steam", "a pair of scissors", 
    "open book on a stand", "butterfly with patterned wings", "spider in a web", "cactus in a pot"
  ],
  // Level 3: Weird & imaginative concepts (30 prompts)
  [
    "an anxious goblin in baroque style", "a melancholic robot tending a zen garden", "a steampunk owl with glowing gears for eyes",
    "a cosmic jellyfish floating through a nebula", "a knight riding a giant snail into battle", "a library where the books have wings and fly",
    "a Victorian-era astronaut sipping tea on the moon", "a haunted grandfather clock with a ghostly face", "a cybernetic dragon forged from chrome and neon",
    "a treehouse growing on the back of a colossal turtle", "a sentient teapot pouring starlight", "a jazz band of skeletons in a smoky club",
    "a floating island held aloft by giant crystals", "a garden of glass flowers that chime in the wind", "a detective octopus wearing a fedora and trench coat",
    "a mushroom city with glowing windows at night", "a post-apocalyptic squirrel in makeshift armor", "a cat wizard casting a spell from a glowing spellbook",
    "a submarine shaped like a narwhal exploring the deep", "a whimsical candy-powered locomotive", "a chef made of vegetables cooking a meal",
    "a chameleon changing its color to match a famous painting", "a sentient cloud raining tiny, colorful stars", "a medieval castle built inside a giant seashell",
    "a gramophone that plays the sounds of the forest", "a sad clown juggling planets", "a mechanical heart with intricate clockwork inside",
    "a lighthouse on a cliff made of stacked books", "a samurai warrior with a laser katana", "a singing cactus in a desert mariachi band"
  ]
];

export const GUESSING_SYSTEM_PROMPT = `You are an AI drawing analyst. The user has drawn a sketch attempting to imitate one of four reference images.

Given:
- The user’s freehand sketch.
- The 4 reference images.
- The original text prompts used to generate those images.

Your task is to determine which of the 4 reference images the user was copying.

**Crucially, if the drawing is not a clear and recognizable attempt at any of the four images, you must give up.** Do not force a guess on a drawing that is ambiguous, nonsensical, or completely unrelated to the options.

Respond ONLY in the following format:
- On the first line, provide the index of the best match (1, 2, 3, or 4).
- **If you are giving up, provide the index 0.**
- On a new line, provide a short explanation (1–2 sentences) justifying your choice or your reason for giving up.

Be approximate and interpretively generous, but do not guess wildly. You are looking for clear intent.
`;