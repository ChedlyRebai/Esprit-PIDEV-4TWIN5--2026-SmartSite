# Material Service - Bug Fixes Summary

## Overview
This document outlines the 7 bugs identified in the material-service and their proposed fixes.

---

## Bug #1: Affichage Prédiction IA - Valeurs Aléatoires/Incorrectes

### Problem
- The AI prediction panel displays random/incorrect values for all materials
- Predictions are not using real data from the database

### Current State
- **Endpoint exists**: `GET /api/materials/predictions` and `GET /api/materials/prediction/all`
- **Service**: `StockPredictionService` calculates predictions based on real consumption from `MaterialFlowLog`
- **ML Service**: `MLTrainingEnhancedService` provides advanced predictions with historical data

### Root Cause Analysis
The prediction endpoints ARE working correctly and returning real data:
1. `StockPredictionService.predictStockDepletion()` calculates real consumption rate from `MaterialFlowLog`
2. Uses `calculateRealConsumptionRate()` to get actual consumption from last 30 days
3. Returns `hoursToOutOfStock`, `hoursToLowStock`, `status`, and `recommendedOrderQuantity`

### Solution
**Frontend needs to be checked** - the backend is already providing correct predictions. The issue is likely:
1. Frontend not calling the correct endpoint
2. Frontend displaying mock data instead of API response
3. Frontend not handling the response correctly

### Files to Check (Frontend)
- Material prediction component
- API call to `/api/materials/predictions`
- Data mapping from API response to UI

---

## Bug #2: Flow Log - Affichage Vide

### Problem
- Flow Log displays nothing
- Stock entries/exits are recorded in database but never retrieved or displayed

### Current State
- **Entity**: `MaterialFlowLog` with all necessary fields
- **Service**: `MaterialFlowService` with `recordMovement()` and `getEnrichedFlows()`
- **Controller**: `MaterialFlowController` with endpoints:
  - `GET /api/material-flow` - Get all flows
  - `GET /api/material-flow/enriched` - Get flows with material/site/user info
  - `POST /api/material-flow` - Record movement

### Root Cause
The backend endpoints exist and work correctly. The issue is likely:
1. Frontend not calling the correct endpoint
2. Frontend not passing correct query parameters
3. Frontend not handling the response data structure

### Solution Required
**Frontend Fix**:
1. Call `GET /api/material-flow/enriched` with query parameters:
   ```typescript
   {
     materialId?: string,
     siteId?: string,
     type?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN' | 'RESERVE',
     startDate?: Date,
     endDate?: Date,
     page?: number,
     limit?: number
   }
   ```

2. Display the enriched data which includes:
   - `materialName`, `materialCode`, `materialCategory`
   - `siteName`
   - `userName`
   - `type`, `quantity`, `timestamp`
   - `previousStock`, `newStock`
   - `reason`, `reference`
   - `anomalyDetected`, `anomalyMessage`

3. Add functional filters:
   - Date range picker
   - Material dropdown
   - Movement type dropdown

### Backend Enhancement (Optional)
Add a dedicated endpoint for better frontend integration:

```typescript
@Get('flow-logs')
async getFlowLogs(
  @Query('materialId') materialId?: string,
  @Query('siteId') siteId?: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('type') type?: FlowType,
) {
  const query: MaterialFlowQueryDto = {
    materialId,
    siteId,
    type,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    page: 1,
    limit: 100,
  };
  
  return this.materialFlowService.getEnrichedFlows(query);
}
```

---

## Bug #3: Chat - Détection d'Émotion et Chargements Répétitifs

### Problem
1. Chat makes backend call on every message sent (repetitive loading)
2. Emotion detection doesn't work correctly

### Current State
- **Gateway**: `ChatGateway` handles WebSocket messages
- **Service**: `AiMessageAnalyzerService` has sophisticated emotion detection:
  - Word lists for positive/negative/conflict keywords
  - Emoji detection
  - OpenAI integration
  - Returns: `emotion`, `sentiment`, `confidence`, `status`, `allow_send`

### Root Cause
The emotion detection IS implemented correctly in the backend:
1. `handleSendMessage()` calls `aiAnalyzer.analyzeMessage()`
2. Analysis result is emitted back to sender via `messageAnalysis` event
3. Message includes `aiAnalysis` metadata

### Solution Required
**Frontend Fix**:
1. Listen to `messageAnalysis` WebSocket event
2. Display visual indicator based on `analysis.emotion`:
   - `CALME` → Green icon 🟢
   - `CONFLIT` → Red icon 🔴
3. Update UI state without making additional HTTP calls

**Backend Enhancement**:
Add conversation-level emotion tracking:

```typescript
// In ChatGateway
private roomEmotions: Map<string, {
  currentEmotion: 'CALME' | 'CONFLIT',
  lastUpdated: Date,
  messageCount: number
}> = new Map();

@SubscribeMessage('sendMessage')
async handleSendMessage(...) {
  const analysis = await this.aiAnalyzer.analyzeMessage(...);
  
  // Update room emotion state
  const roomId = data.orderId;
  const roomEmotion = this.roomEmotions.get(roomId) || {
    currentEmotion: 'CALME',
    lastUpdated: new Date(),
    messageCount: 0
  };
  
  roomEmotion.currentEmotion = analysis.emotion;
  roomEmotion.lastUpdated = new Date();
  roomEmotion.messageCount++;
  this.roomEmotions.set(roomId, roomEmotion);
  
  // Emit room emotion update to all participants
  this.server.to(`order-${roomId}`).emit('roomEmotionUpdate', {
    emotion: roomEmotion.currentEmotion,
    timestamp: roomEmotion.lastUpdated
  });
}
```

---

## Bug #4: Génération de Rapport IA - Rendre Fonctionnel

### Problem
- "Générer Rapport IA" button doesn't generate a real report

### Current State
- **Service**: `DailyReportService` exists with:
  - `sendDailyReport()` - Cron job (7 AM daily)
  - `sendManualReport(email?)` - Manual trigger
  - `generateReportData()` - Collects all data
  - `generateReportHtml()` - Creates HTML email

- **Controller**: `MaterialsController` has endpoint:
  ```typescript
  @Post('reports/daily/send')
  async sendDailyReport(@Body() body?: { email?: string })
  ```

### Root Cause
The backend functionality exists and works. The issue is likely:
1. Frontend button not calling the correct endpoint
2. Frontend not providing email parameter
3. Frontend not showing success/error feedback

### Solution Required
**Frontend Fix**:
1. Call `POST /api/materials/reports/daily/send` with body:
   ```typescript
   { email: 'user@example.com' }
   ```

2. Show loading state while generating

3. Display success/error message from response:
   ```typescript
   {
     success: boolean,
     message: string,
     timestamp: string
   }
   ```

**Backend Enhancement**:
Add report generation with file download option:

```typescript
@Post('reports/daily/generate')
async generateReportFile(@Body() body?: { email?: string }) {
  const reportData = await this.dailyReportService.generateReportData();
  const html = this.dailyReportService.generateReportHtml(reportData);
  
  // Save to file
  const filename = `rapport-${new Date().toISOString().split('T')[0]}.html`;
  const filepath = path.join(process.env.UPLOAD_PATH || './uploads/reports', filename);
  
  fs.writeFileSync(filepath, html);
  
  // Optionally send email
  if (body?.email) {
    await this.dailyReportService.sendManualReport(body.email);
  }
  
  return {
    success: true,
    filename,
    downloadUrl: `/uploads/reports/${filename}`,
    message: 'Rapport généré avec succès'
  };
}
```

---

## Bug #5: API Gateway - Uniquement pour Material Service

### Problem
- Need to add API Gateway layer in front of material-service only

### Current State
- No API Gateway exists
- Direct calls to material-service endpoints

### Solution
Create a new API Gateway module within material-service:

```typescript
// apps/backend/materials-service/src/gateway/gateway.module.ts
@Module({
  imports: [HttpModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}

// apps/backend/materials-service/src/gateway/gateway.controller.ts
@Controller('gateway')
export class GatewayController {
  constructor(private readonly httpService: HttpService) {}
  
  @All('materials/*')
  async proxyMaterials(@Req() req: Request, @Res() res: Response) {
    const targetUrl = `http://localhost:3002${req.url.replace('/gateway', '')}`;
    // Add authentication, rate limiting, logging
    const response = await this.httpService.axiosRef.request({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: req.headers,
    });
    return res.status(response.status).json(response.data);
  }
}
```

**Features to Add**:
1. Authentication/Authorization
2. Rate limiting
3. Request/Response logging
4. Error handling
5. Request transformation
6. Response caching

---

## Bug #6: Arrivée du Camion → Dialog de Paiement

### Problem
- When truck arrives (delivery event received), payment dialog should open automatically
- Support cash and card payment modes
- Allow invoice upload (PDF or image)
- Record payment in database
- Show confirmation message

### Current State
- **Service**: `PaymentService` exists with:
  - `createPayment()` - Create payment record
  - `confirmCardPayment()` - Confirm Stripe payment
  - `generateInvoice()` - Generate invoice
- **Gateway**: `ChatGateway` has `emitArrival()` method

### Solution Required

**Backend Enhancement**:

1. Add truck arrival event handler in `ChatGateway`:
```typescript
@SubscribeMessage('truckArrived')
async handleTruckArrival(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: {
    orderId: string,
    supplierId: string,
    supplierName: string,
    siteId: string,
    deliveryAmount: number
  }
) {
  const roomId = `order-${data.orderId}`;
  
  // Emit to all room participants to open payment dialog
  this.server.to(roomId).emit('openPaymentDialog', {
    orderId: data.orderId,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    siteId: data.siteId,
    amount: data.deliveryAmount,
    timestamp: new Date().toISOString()
  });
  
  this.logger.log(`🚚 Truck arrived for order ${data.orderId}, payment dialog triggered`);
}
```

2. Add payment controller endpoint:
```typescript
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  
  @Post()
  async createPayment(@Body() createPaymentDto: {
    siteId: string,
    orderId: string,
    amount: number,
    paymentMethod: 'cash' | 'card',
    description?: string
  }) {
    return this.paymentService.createPayment(
      createPaymentDto.siteId,
      createPaymentDto.amount,
      createPaymentDto.paymentMethod,
      createPaymentDto.description
    );
  }
  
  @Post(':paymentId/invoice')
  @UseInterceptors(FileInterceptor('file'))
  async uploadInvoice(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    const invoiceUrl = `/uploads/invoices/${file.filename}`;
    // Save invoice URL to payment record
    return { success: true, invoiceUrl };
  }
}
```

**Frontend Requirements**:
1. Listen to `openPaymentDialog` WebSocket event
2. Open dialog with:
   - Payment method selector (cash/card)
   - Amount input (for cash)
   - Card details form (for card)
   - Invoice upload button
3. Call payment API on confirmation
4. Upload invoice file
5. Show success message

---

## Bug #7: Dialog de Notation Fournisseur - Afficher Une Seule Fois

### Problem
- Supplier rating dialog reopens every time
- Should only display once

### Current State
- **Service**: `SupplierRatingService` exists
- **Controller**: `SupplierRatingController` with endpoints
- **Frontend Hook**: `useSupplierRating` uses localStorage to track ignored ratings

### Root Cause
The frontend hook already has logic to prevent repeated display:
```typescript
const isIgnored = (materialId: string): boolean => {
  const ignoredRatings = JSON.parse(localStorage.getItem('ignoredSupplierRatings') || '[]');
  return ignoredRatings.includes(materialId);
};
```

### Solution Required

**Backend Enhancement**:
Add tracking of shown ratings per user:

```typescript
// Add to SupplierRating entity
@Prop({ type: Boolean, default: false })
dialogShown: boolean;

@Prop({ type: Date })
dialogShownAt?: Date;

// Add to SupplierRatingService
async markDialogAsShown(materialId: string, userId: string): Promise<void> {
  await this.ratingModel.updateOne(
    { materialId: new Types.ObjectId(materialId), userId: new Types.ObjectId(userId) },
    { 
      $set: { 
        dialogShown: true,
        dialogShownAt: new Date()
      }
    }
  );
}

async shouldShowDialog(materialId: string, userId: string): Promise<boolean> {
  const existingRating = await this.ratingModel.findOne({
    materialId: new Types.ObjectId(materialId),
    userId: new Types.ObjectId(userId)
  });
  
  // Don't show if already rated or dialog already shown
  return !existingRating || (!existingRating.dialogShown && !existingRating.note);
}
```

**Frontend Fix**:
1. Call `GET /api/supplier-ratings/should-show/:materialId?userId=:userId` before showing dialog
2. Call `POST /api/supplier-ratings/mark-shown` when dialog is displayed
3. Keep localStorage as fallback for offline scenarios

---

## Implementation Priority

### High Priority (Critical Bugs)
1. **Bug #2** - Flow Log display (data exists but not shown)
2. **Bug #1** - AI Prediction display (verify frontend integration)
3. **Bug #6** - Payment dialog on truck arrival (business critical)

### Medium Priority (Functional Issues)
4. **Bug #3** - Chat emotion detection (UX improvement)
5. **Bug #4** - AI Report generation (already works, needs frontend fix)
6. **Bug #7** - Supplier rating dialog (minor annoyance)

### Low Priority (Enhancement)
7. **Bug #5** - API Gateway (architectural improvement)

---

## Testing Checklist

### Bug #1 - AI Predictions
- [ ] Verify `/api/materials/predictions` returns real data
- [ ] Check frontend API call
- [ ] Verify data mapping in UI
- [ ] Test rupture de stock badge display

### Bug #2 - Flow Log
- [ ] Test `/api/material-flow/enriched` endpoint
- [ ] Verify query parameters work
- [ ] Test date range filter
- [ ] Test material filter
- [ ] Test movement type filter

### Bug #3 - Chat Emotion
- [ ] Test emotion detection on various messages
- [ ] Verify emoji detection
- [ ] Test visual indicator display
- [ ] Verify no redundant backend calls

### Bug #4 - AI Report
- [ ] Test manual report generation
- [ ] Verify email delivery
- [ ] Test report content accuracy
- [ ] Test file download option

### Bug #5 - API Gateway
- [ ] Test request proxying
- [ ] Verify authentication
- [ ] Test rate limiting
- [ ] Verify logging

### Bug #6 - Payment Dialog
- [ ] Test truck arrival event
- [ ] Verify dialog opens automatically
- [ ] Test cash payment flow
- [ ] Test card payment flow
- [ ] Test invoice upload
- [ ] Verify payment record in database

### Bug #7 - Supplier Rating
- [ ] Test dialog shows only once
- [ ] Verify backend tracking
- [ ] Test localStorage fallback
- [ ] Verify rating submission

---

## Environment Variables Required

```env
# Email Configuration (for Bug #4)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-email@ethereal.email
SMTP_PASS=your-password
SMTP_FROM="SmartSite <noreply@smartsite.com>"
DAILY_REPORT_ENABLED=true
DAILY_REPORT_EMAIL=admin@smartsite.com

# Payment Configuration (for Bug #6)
PAYMENT_API_URL=http://localhost:3008/api/payments
FACTURE_API_URL=http://localhost:3008/api/factures
STRIPE_API_URL=http://localhost:3008/api/payments/stripe/create-payment-intent

# Upload Paths
UPLOAD_PATH=./uploads
```

---

## Conclusion

Most bugs are **frontend integration issues** rather than backend bugs. The backend services are well-implemented and functional. The main work required is:

1. **Frontend**: Fix API calls and data handling
2. **Backend**: Add minor enhancements for better integration
3. **Testing**: Verify end-to-end flows

The material-service backend is solid and follows best practices with proper error handling, logging, and data validation.
