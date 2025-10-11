# Inventory Management System API Test Script (PowerShell)
# This script tests the complete API flow

$BaseUrl = "http://localhost:5000/api"
$AuthToken = ""

Write-Host "=== INVENTORY MANAGEMENT SYSTEM API TEST ===" -ForegroundColor Green
Write-Host ""

# Function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }
    
    try {
        if ($Data) {
            return Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method $Method -Headers $headers -Body $Data
        } else {
            return Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method $Method -Headers $headers
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "1) Testing Authentication..." -ForegroundColor Yellow
Write-Host "   Logging in as admin..."

$loginData = @{
    email = "admin@example.com"
    password = "AdminPass123"
} | ConvertTo-Json

$loginResponse = Invoke-ApiCall -Method "POST" -Endpoint "/auth/login" -Data $loginData

if ($loginResponse -and $loginResponse.token) {
    $AuthToken = $loginResponse.token
    Write-Host "   Auth token: $($AuthToken.Substring(0, 20))..." -ForegroundColor Green
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Login failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "2) Testing Products API..." -ForegroundColor Yellow
Write-Host "   Getting all products..."
$productsResponse = Invoke-ApiCall -Method "GET" -Endpoint "/products"
if ($productsResponse) {
    $productCount = if ($productsResponse.products) { $productsResponse.products.Count } else { $productsResponse.Count }
    Write-Host "   Products found: $productCount" -ForegroundColor Green
    Write-Host "   ✅ Products API working!" -ForegroundColor Green
}
Write-Host ""

Write-Host "3) Testing Warehouses API..." -ForegroundColor Yellow
Write-Host "   Getting all warehouses..."
$warehousesResponse = Invoke-ApiCall -Method "GET" -Endpoint "/warehouses"
if ($warehousesResponse) {
    Write-Host "   Warehouses found: $($warehousesResponse.Count)" -ForegroundColor Green
    Write-Host "   ✅ Warehouses API working!" -ForegroundColor Green
}
Write-Host ""

Write-Host "4) Testing Purchases API..." -ForegroundColor Yellow
Write-Host "   Getting all purchases..."
$purchasesResponse = Invoke-ApiCall -Method "GET" -Endpoint "/purchases"
if ($purchasesResponse) {
    Write-Host "   Purchases found: $($purchasesResponse.Count)" -ForegroundColor Green
    Write-Host "   ✅ Purchases API working!" -ForegroundColor Green
}
Write-Host ""

Write-Host "5) Testing Sales API..." -ForegroundColor Yellow
Write-Host "   Getting all sales orders..."
$salesResponse = Invoke-ApiCall -Method "GET" -Endpoint "/sales/orders"
if ($salesResponse) {
    Write-Host "   Sales orders found: $($salesResponse.Count)" -ForegroundColor Green
    Write-Host "   ✅ Sales API working!" -ForegroundColor Green
}
Write-Host ""

Write-Host "6) Testing Reports API..." -ForegroundColor Yellow
Write-Host "   Getting dashboard metrics..."
$reportsResponse = Invoke-ApiCall -Method "GET" -Endpoint "/reports/dashboard"
if ($reportsResponse) {
    Write-Host "   Dashboard response received" -ForegroundColor Green
    Write-Host "   📊 Dashboard Metrics:" -ForegroundColor Cyan
    Write-Host "      - Total Products: $($reportsResponse.totalProducts)" -ForegroundColor White
    Write-Host "      - Total Stock: $($reportsResponse.totalItemsInStock)" -ForegroundColor White
    Write-Host "      - Total Warehouses: $($reportsResponse.totalWarehouses)" -ForegroundColor White
    Write-Host "      - Dispatched Units: $($reportsResponse.totalDispatchedProducts.units)" -ForegroundColor White
    Write-Host "      - Returns: $($reportsResponse.returns.units)" -ForegroundColor White
    Write-Host "      - Delivered: $($reportsResponse.successfulDeliveries.units)" -ForegroundColor White
    Write-Host "   ✅ Reports API working!" -ForegroundColor Green
}
Write-Host ""

Write-Host "7) Verification Tests..." -ForegroundColor Yellow
Write-Host "   Checking final state..."

# Expected values
$ExpectedProducts = 3
$ExpectedStock = 170
$ExpectedWarehouses = 1
$ExpectedDispatched = 15
$ExpectedReturns = 5
$ExpectedDelivered = 10

# Test results
$ProductsTest = if ($reportsResponse.totalProducts -eq $ExpectedProducts) { "✅" } else { "❌" }
$StockTest = if ($reportsResponse.totalItemsInStock -eq $ExpectedStock) { "✅" } else { "❌" }
$WarehousesTest = if ($reportsResponse.totalWarehouses -eq $ExpectedWarehouses) { "✅" } else { "❌" }
$DispatchedTest = if ($reportsResponse.totalDispatchedProducts.units -eq $ExpectedDispatched) { "✅" } else { "❌" }
$ReturnsTest = if ($reportsResponse.returns.units -eq $ExpectedReturns) { "✅" } else { "❌" }
$DeliveredTest = if ($reportsResponse.successfulDeliveries.units -eq $ExpectedDelivered) { "✅" } else { "❌" }

Write-Host "   Products: $ProductsTest (Expected: $ExpectedProducts, Actual: $($reportsResponse.totalProducts))" -ForegroundColor White
Write-Host "   Stock: $StockTest (Expected: $ExpectedStock, Actual: $($reportsResponse.totalItemsInStock))" -ForegroundColor White
Write-Host "   Warehouses: $WarehousesTest (Expected: $ExpectedWarehouses, Actual: $($reportsResponse.totalWarehouses))" -ForegroundColor White
Write-Host "   Dispatched: $DispatchedTest (Expected: $ExpectedDispatched, Actual: $($reportsResponse.totalDispatchedProducts.units))" -ForegroundColor White
Write-Host "   Returns: $ReturnsTest (Expected: $ExpectedReturns, Actual: $($reportsResponse.returns.units))" -ForegroundColor White
Write-Host "   Delivered: $DeliveredTest (Expected: $ExpectedDelivered, Actual: $($reportsResponse.successfulDeliveries.units))" -ForegroundColor White
Write-Host ""

Write-Host "=== TEST SUMMARY ===" -ForegroundColor Green
if ($ProductsTest -eq "✅" -and $StockTest -eq "✅" -and $WarehousesTest -eq "✅" -and $DispatchedTest -eq "✅" -and $ReturnsTest -eq "✅" -and $DeliveredTest -eq "✅") {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "✅ The inventory management system is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 System Status:" -ForegroundColor Cyan
    Write-Host "   - Backend API: ✅ Working" -ForegroundColor Green
    Write-Host "   - Authentication: ✅ Working" -ForegroundColor Green
    Write-Host "   - Database: ✅ Connected" -ForegroundColor Green
    Write-Host "   - Seed Data: ✅ Loaded" -ForegroundColor Green
    Write-Host "   - Final Counts: ✅ Verified" -ForegroundColor Green
} else {
    Write-Host "⚠️  SOME TESTS FAILED" -ForegroundColor Yellow
    Write-Host "Please check the system setup and ensure:" -ForegroundColor Yellow
    Write-Host "   1. MongoDB is running" -ForegroundColor Yellow
    Write-Host "   2. Seed scripts have been executed" -ForegroundColor Yellow
    Write-Host "   3. Backend server is running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== TEST COMPLETED ===" -ForegroundColor Green
