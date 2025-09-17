# Quickstart Guide: WedSync & WedMe Platform

**Purpose**: Validate end-to-end functionality of the wedding platform  
**Duration**: ~30 minutes  
**Prerequisites**: Development environment set up, test accounts created

## Overview

This quickstart guide walks through the complete user journey for both platforms:
1. **WedSync (Supplier)**: Create forms, set up journeys, manage clients
2. **WedMe (Couple)**: Plan wedding, manage guests, collaborate with suppliers
3. **Integration**: Real-time sync between platforms

## Setup Requirements

### Environment Setup
- [ ] Next.js 14+ development environment
- [ ] Supabase local development setup
- [ ] Test API keys for integrations (Twilio, SendGrid, OpenAI)
- [ ] Playwright test environment

### Test Data
- [ ] Supplier test account (photographer specialization)
- [ ] Couple test accounts (2 users for same wedding)
- [ ] Sample wedding data (date, venues, guest list)

## Part 1: WedSync Supplier Journey (15 minutes)

### 1.1 Supplier Onboarding
**Goal**: Complete supplier profile setup

**Steps**:
1. Navigate to `https://wedsync.com/signup`
2. Create supplier account with email/password
3. Complete business profile:
   - Business Name: "Perfect Moments Photography"
   - Specialization: Photographer
   - Location: London, UK
   - Description: "Award-winning wedding photography"

**Expected Result**: ✅ Supplier dashboard loads with welcome tour

**Test Commands**:
```bash
# Run supplier onboarding test
npm run test:e2e -- --grep "supplier onboarding"
```

### 1.2 AI Form Generation
**Goal**: Create wedding photography form using AI

**Steps**:
1. Click "Create Form" → "AI Generate"
2. Enter prompt: "Photography form for London wedding including shot list, timeline preferences, and family photo requirements"
3. Review generated form fields:
   - Timeline preferences
   - Shot list requirements
   - Family group photos
   - Special requests
4. Customize form layout (2-column)
5. Save form as "Wedding Photography Questionnaire"

**Expected Result**: ✅ Form created with venue-specific fields auto-added

**Test Commands**:
```bash
# Test AI form generation
npm run test:integration -- src/tests/forms/ai-generation.test.ts
```

### 1.3 Customer Journey Setup
**Goal**: Create automated client onboarding journey

**Steps**:
1. Navigate to Journeys → "Create Journey"
2. Build workflow with drag-and-drop:
   - Start: Form Submission trigger
   - Step 1: Welcome email (use template)
   - Step 2: Calendar booking link (7 days delay)
   - Step 3: Follow-up SMS if no response (3 days delay)
3. Configure A/B test for email subject lines
4. Activate journey

**Expected Result**: ✅ Journey activated with performance tracking enabled

### 1.4 Client Management
**Goal**: Add wedding client and monitor engagement

**Steps**:
1. Navigate to Clients → "Add Client"
2. Create wedding entry:
   - Couple: Sarah & James Wilson
   - Date: 2025-08-15
   - Venue: The Georgian Terrace Hotel, London
   - Guest count: 120
3. Send photography form to couple
4. Monitor engagement dashboard

**Expected Result**: ✅ Client added, form sent, engagement tracking active

## Part 2: WedMe Couple Journey (15 minutes)

### 2.1 Couple Account Creation
**Goal**: Set up joint wedding planning account

**Steps**:
1. Navigate to `https://wedme.app/signup`
2. Create primary account (Sarah)
3. Invite partner (James) to wedding
4. Both users verify access to shared wedding

**Expected Result**: ✅ Both users can access shared wedding dashboard

### 2.2 Core Wedding Details
**Goal**: Complete essential wedding information

**Steps**:
1. Open "Wedding Details" section
2. Enter core information:
   - Wedding Date: August 15, 2025
   - Ceremony: St. Mary's Church, London
   - Reception: The Georgian Terrace Hotel, London
   - Guest Count: 120
   - Theme: Classic Elegance
   - Special Requirements: Kosher meal options
3. Mark core details as complete

**Expected Result**: ✅ Core details completion triggers supplier form auto-population

### 2.3 Guest Management
**Goal**: Build complete guest list with dietary tracking

**Steps**:
1. Navigate to "Guests" section
2. Import CSV with 120 guests (provided test file)
3. Set up photo groups:
   - Immediate Family (12 people)
   - Extended Family (25 people)  
   - Friends (35 people)
   - Work Colleagues (20 people)
4. Configure plus-one permissions
5. Send digital save-the-dates to 50% of guests

**Expected Result**: ✅ Guest list organized, photo groups created, save-the-dates sent

### 2.4 Supplier Form Completion
**Goal**: Complete photography form from WedSync supplier

**Steps**:
1. Check "Forms" section for pending forms
2. Open "Wedding Photography Questionnaire"
3. Notice core details pre-populated (read-only)
4. Complete custom fields:
   - Preferred timeline: First look at 2pm
   - Must-have shots: Ring exchange, first dance
   - Family photo groups: Use imported groups
   - Special requests: Drone shots (if permitted)
5. Submit form

**Expected Result**: ✅ Form submitted, triggers supplier journey, engagement score increases

### 2.5 Timeline Management
**Goal**: Create master wedding timeline with supplier integration

**Steps**:
1. Navigate to "Timeline" section
2. Add key events:
   - 11am: Hair & makeup starts
   - 2pm: First look photos
   - 4pm: Ceremony begins
   - 6pm: Cocktail hour
   - 7pm: Reception dinner
   - 10pm: Dancing begins
3. Set venue-specific details (travel time, setup requirements)
4. Share timeline with all suppliers

**Expected Result**: ✅ Timeline created, suppliers notified of schedule updates

## Part 3: Cross-Platform Integration (10 minutes)

### 3.1 Real-Time Data Sync
**Goal**: Verify data synchronization between platforms

**Steps**:
1. **In WedMe**: Update guest count from 120 to 125
2. **In WedSync**: Verify supplier sees updated guest count immediately
3. **In WedSync**: Update photography timeline (ceremony start 4:15pm)
4. **In WedMe**: Verify timeline update appears in real-time
5. **In WedMe**: Add dietary requirement for guest
6. **In WedSync**: Verify caterer (if connected) sees dietary update

**Expected Result**: ✅ All changes sync within 2 seconds across platforms

### 3.2 Communication Flow
**Goal**: Test integrated messaging system

**Steps**:
1. **In WedSync**: Send message to couple about photo timeline
2. **In WedMe**: Receive and respond to supplier message
3. **In WedSync**: Receive response notification
4. Check message appears in both platforms' communication history

**Expected Result**: ✅ Messages sync bidirectionally with delivery confirmations

### 3.3 Journey Automation
**Goal**: Verify automated workflows execute correctly

**Steps**:
1. Trigger: Form submission completed (already done in 2.4)
2. Wait 30 seconds for welcome email
3. Check email delivery in test inbox
4. Verify A/B test variant recorded
5. Confirm engagement score updated in WedSync

**Expected Result**: ✅ Automated email sent, metrics tracked, engagement score increased

## Part 4: Admin Dashboard Validation (5 minutes)

### 4.1 Platform Metrics
**Goal**: Verify admin visibility into platform health

**Steps**:
1. Login to admin dashboard
2. Check real-time metrics:
   - Active users: 2+ online
   - Forms submitted: 1+ today
   - Journey enrollments: 1+ active
   - API response times: <200ms average
3. Review user activity feed
4. Check system health indicators

**Expected Result**: ✅ All metrics showing healthy platform status

### 4.2 Data Privacy Controls
**Goal**: Verify GDPR compliance tooling

**Steps**:
1. Navigate to "Data Privacy" section
2. Search for test user email
3. View data summary (anonymized)
4. Test data export functionality
5. Verify audit log captures all actions

**Expected Result**: ✅ Privacy controls operational, audit trail complete

## Success Criteria

### Functional Requirements Validated
- [x] **FR-005**: AI form generation working
- [x] **FR-010**: Core wedding data auto-population  
- [x] **FR-031**: Core details captured once, reused everywhere
- [x] **FR-037**: Real-time sync between platforms operational
- [x] **FR-017**: Engagement scoring functional
- [x] **FR-032**: Guest management with dietary tracking
- [x] **FR-034**: Master timeline with supplier integration

### Performance Requirements
- [x] Page load times < 2 seconds
- [x] Real-time sync latency < 2 seconds  
- [x] Form submission processing < 500ms
- [x] Search queries < 1 second

### Integration Requirements
- [x] Email delivery functional
- [x] SMS/WhatsApp sending (test mode)
- [x] Calendar integration working
- [x] File upload operational
- [x] Webhook delivery confirmed

## Troubleshooting

### Common Issues

**Issue**: Forms not auto-populating core details
- **Solution**: Check wedding `core_details_complete` flag is true
- **Test**: `GET /api/weddings/{id}` should show `core_details_complete: true`

**Issue**: Real-time sync not working
- **Solution**: Verify Supabase real-time subscription active
- **Test**: Check browser dev tools WebSocket connections

**Issue**: Journey not triggering
- **Solution**: Confirm trigger conditions match event data
- **Test**: Check journey enrollment in database

**Issue**: High page load times
- **Solution**: Verify CDN serving static assets
- **Test**: Network tab should show 200ms for cached assets

### Test Commands Reference

```bash
# Run full quickstart test suite
npm run test:quickstart

# Individual component tests
npm run test:supplier-onboarding
npm run test:couple-registration  
npm run test:form-generation
npm run test:real-time-sync
npm run test:journey-automation

# Performance benchmarks
npm run test:performance
npm run test:load -- --users=100

# Database integrity checks
npm run test:database-constraints
npm run test:rls-policies
```

## Next Steps

After successful quickstart completion:

1. **Scale Testing**: Run with 100+ concurrent users
2. **Integration Testing**: Add additional supplier types (caterer, DJ, florist)
3. **Mobile Testing**: Verify PWA functionality on mobile devices
4. **Performance Optimization**: Run SonarQube analysis and optimize bottlenecks
5. **Security Testing**: Penetration testing and vulnerability scanning

---

**Quickstart completion indicates readiness for production deployment** ✅

*Estimated total time: 30 minutes*  
*Success rate target: >95% of steps complete without errors*