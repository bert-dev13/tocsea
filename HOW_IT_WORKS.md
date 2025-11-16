# How TOCSEA Works: Simple Guide

## What Does TOCSEA Do?

TOCSEA helps predict how much soil will be lost from coastal areas each year. It uses math to calculate and AI to suggest plants that can help.

---

## Step 1: You Enter Information

You need to provide 4 things:

1. **Seawall Length** - How long is the wall along the coast? (in meters)
2. **Typhoons per Year** - How many typhoons happen each year?
3. **Floods per Year** - How many floods happen each year?
4. **Soil Type** - What type of soil? (Sandy, Clay, Loamy, Silty, Peaty, or Chalky)

**Example:**
- Seawall: 150 meters
- Typhoons: 3 per year
- Floods: 2 per year
- Soil Type: Loamy Soil

The system checks that all numbers are valid before calculating.

---

## Step 2: The System Calculates Soil Loss

The system uses this formula:

```
Soil Loss = 81,610.062 - (54.458 × Seawall) + (2,665.351 × Typhoons) + (2,048.205 × Floods)
```

### What Each Part Means:

- **81,610.062** - Starting number
- **- (54.458 × Seawall)** - Seawalls help reduce soil loss (that's why it's minus)
- **+ (2,665.351 × Typhoons)** - Typhoons increase soil loss (that's why it's plus)
- **+ (2,048.205 × Floods)** - Floods increase soil loss (that's why it's plus)

### Example Calculation:

**Input:**
- Seawall: 150 meters
- Typhoons: 3
- Floods: 2

**Calculation:**
```
Soil Loss = 81,610.062 - (54.458 × 150) + (2,665.351 × 3) + (2,048.205 × 2)
          = 81,610.062 - 8,168.7 + 7,996.053 + 4,096.41
          = 85,533.82 metric tons per year
```

**Result:** 85,533.82 metric tons of soil will be lost per year

---

## Step 3: AI Gives Recommendations

After calculating, the AI suggests plants and ways to prevent soil loss.

### How AI Works:

1. The system sends your soil loss number and soil type to the AI
2. The AI thinks about which plants work best for your situation
3. The AI gives you two types of recommendations:

#### Type 1: Plants to Plant

The AI tells you which plants and how many:

**Example:**
- 🌴 Coconut – 25 trees
- 🌿 Pandan – 50 trees
- 🌳 Mahogany – 30 trees
- 🌾 Vetiver grass – 100 clumps

**How AI decides:**
- Different soil types need different plants
- More soil loss = more plants needed
- The AI knows which plants work best for each soil type

#### Type 2: Detailed Advice

The AI gives advice in 3 parts:

1. **How to reduce soil loss** - Ways to prevent erosion
2. **How to take care of your soil type** - Tips for your specific soil
3. **How to plant and care for the plants** - Instructions for planting

---

## Complete Example

**Step 1: You Enter**
- Seawall: 200 meters
- Typhoons: 5 per year
- Floods: 3 per year
- Soil Type: Sandy Soil

**Step 2: System Calculates**
```
Soil Loss = 81,610.062 - (54.458 × 200) + (2,665.351 × 5) + (2,048.205 × 3)
          = 90,189.83 metric tons per year
```

**Step 3: AI Recommends**
- Plants: Coconut trees, Pandan, Mahogany, Vetiver grass, Bamboo
- Advice: How to reduce erosion, how to care for sandy soil, how to plant the trees

**Step 4: You Get Results**
- You see the predicted soil loss
- You see recommended plants
- You see detailed advice
- You can download a PDF or copy the results

---

## Simple Summary

1. **You enter** → Seawall length, typhoons, floods, soil type
2. **System calculates** → Uses formula to predict soil loss
3. **AI suggests** → Recommends plants and strategies
4. **You get results** → See predictions and recommendations

### Important Points:

- ✅ Seawalls help reduce soil loss
- ✅ Typhoons and floods increase soil loss
- ✅ Different soil types need different plants
- ✅ More soil loss needs more plants
- ✅ The AI uses your specific information to give recommendations

---

## Common Questions

**Q: Why can't soil loss be negative?**
A: You can't have negative soil loss. You either lose soil or you don't.

**Q: How accurate is this?**
A: It's an estimate based on real data. Actual results may vary.

**Q: Why different plants for different soils?**
A: Different plants grow better in different soils. Sandy soil needs different plants than clay soil.

**Q: How does AI know how many plants?**
A: The AI looks at how much soil loss you have. More loss = more plants needed.

---

That's it! The system is simple: enter data → get calculation → get AI recommendations.
py