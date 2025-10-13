# Backend Tests

## Add Stock Test

Tests the complete Add Stock functionality including:
- Fetching warehouses
- Fetching products  
- Adding stock to a warehouse
- Verifying the stock was added

### Run the Test

```bash
# From the backend directory
npm run test:add-stock

# Or directly
node tests/test-add-stock.js
```

### Prerequisites

1. **Backend server must be running** on port 5000
   ```bash
   npm run dev
   ```

2. **Database must have:**
   - At least one warehouse
   - At least one product

### Expected Output

```
🔍 DETAILED ADD STOCK TEST
═══════════════════════════════════════

📦 Step 1: Fetching warehouses...
   ✅ Found X warehouses
   📍 Selected: [Warehouse Name]
   📊 Capacity: X/XXXX

📦 Step 2: Fetching products...
   ✅ Found X products
   📍 Selected: [Product Name] ([SKU])
   💰 Price: PKR XXXX

📦 Step 3: Adding stock...
   ✅ SUCCESS! Stock added

📦 Step 4: Verifying...
   ✅ Updated stock: X/XXXX
   📊 Utilization: X%

═══════════════════════════════════════
✅ ALL TESTS PASSED - Add Stock is working!
```

### What It Tests

- ✅ Backend API is accessible
- ✅ Warehouses endpoint works
- ✅ Products endpoint works
- ✅ Add Stock endpoint works
- ✅ Stock is actually added to warehouse
- ✅ Warehouse stats update correctly

### If Test Fails

1. **"No response from server"**
   - Backend not running on port 5000
   - Run: `npm run dev`

2. **"No warehouses found"**
   - Create warehouse at: `/warehouses/new`

3. **"No products found"**
   - Create product at: `/products/new`

4. **"Capacity exceeded"**
   - Warehouse is full
   - Use different warehouse or increase capacity

