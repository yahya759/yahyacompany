import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFunnelConversions,
  getScoreCategory,
  filterProblems,
  processMessageAction,
  type ProblemItem,
  type PendingMessage,
} from './dashboardLogic';

test('calculateFunnelConversions calculates accurate conversion percentage between steps', () => {
  const rawStages = [
    { id: '1', nameAr: 'المشكلة', nameEn: 'Problem', count: 1000 },
    { id: '2', nameAr: 'الحل', nameEn: 'Solution', count: 500 },
    { id: '3', nameAr: 'العميل المحتمل', nameEn: 'Lead', count: 250 },
    { id: '4', nameAr: 'الرسالة', nameEn: 'Message', count: 125 },
  ];

  const result = calculateFunnelConversions(rawStages);
  assert.equal(result[0].conversionFromPrev, 100);
  assert.equal(result[1].conversionFromPrev, 50);
  assert.equal(result[2].conversionFromPrev, 50);
  assert.equal(result[3].conversionFromPrev, 50);
});

test('getScoreCategory classifies high, medium, and low opportunity scores', () => {
  const high = getScoreCategory(94);
  assert.equal(high.color, 'green');
  assert.equal(high.labelAr, 'فرصة عالية');

  const medium = getScoreCategory(72);
  assert.equal(medium.color, 'orange');
  assert.equal(medium.labelAr, 'فرصة واعدة');

  const low = getScoreCategory(45);
  assert.equal(low.color, 'red');
  assert.equal(low.labelAr, 'فرصة عادية');
});

test('filterProblems filters by keyword and market sector accurately', () => {
  const sampleProblems: ProblemItem[] = [
    {
      id: 'p1',
      title: 'إلغاء حجوزات المطاعم بدون إشعار',
      sector: 'المطاعم والضيافة',
      sectorKey: 'fnb',
      source: 'google-maps',
      sourceName: 'Google Maps',
      score: 92,
      market: 'gulf',
      leadsCount: 42,
      snippet: 'تكرار عدم حضور الزبائن',
      dateAdded: '2026-10-20',
    },
    {
      id: 'p2',
      title: 'بطء الرد على استفسارات العقارات في واتساب',
      sector: 'العقارات',
      sectorKey: 'real-estate',
      source: 'x',
      sourceName: 'X',
      score: 88,
      market: 'gulf',
      leadsCount: 85,
      snippet: 'الوسطاء يفقدون صفقات بسبب التأخر',
      dateAdded: '2026-10-19',
    },
    {
      id: 'p3',
      title: 'مشاكل مرتجعات المتاجر الإلكترونية في مصر',
      sector: 'التجارة الإلكترونية',
      sectorKey: 'ecommerce',
      source: 'facebook',
      sourceName: 'Facebook',
      score: 65,
      market: 'arabic',
      leadsCount: 19,
      snippet: 'تكلفة الشحن العكسي مرتفعة',
      dateAdded: '2026-10-18',
    },
  ];

  // Search by keyword
  const searchResults = filterProblems(sampleProblems, 'عقارات', 'all', 'all');
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, 'p2');

  // Filter by market
  const gulfResults = filterProblems(sampleProblems, '', 'all', 'gulf');
  assert.equal(gulfResults.length, 2);

  // Filter by sector
  const fnbResults = filterProblems(sampleProblems, '', 'fnb', 'all');
  assert.equal(fnbResults.length, 1);
  assert.equal(fnbResults[0].id, 'p1');
});

test('processMessageAction removes processed message and updates content on edit', () => {
  const queue: PendingMessage[] = [
    {
      id: 'm1',
      leadName: 'د. خالد الشمري',
      leadTitle: 'المدير التنفيذي',
      company: 'مجمع النخبة الطبي',
      city: 'الرياض',
      sector: 'رعاية صحية',
      channel: 'whatsapp',
      painPoint: 'إلغاء المواعيد المتكرر',
      aiMessagePreview: 'مرحبا دكتور خالد، لاحظنا شكاوى المرضى...',
      demoUrl: 'https://demo.problem2client.com/medical-bot',
      confidenceScore: 96,
    },
    {
      id: 'm2',
      leadName: 'م. سارة العتيبي',
      leadTitle: 'مديرة العمليات',
      company: 'نماء العقارية',
      city: 'دبي',
      sector: 'عقارات',
      channel: 'email',
      painPoint: 'تأخر الرد على المستأجرين',
      aiMessagePreview: 'أهلاً مهندسة سارة...',
      demoUrl: 'https://demo.problem2client.com/real-estate',
      confidenceScore: 91,
    },
  ];

  const sendResult = processMessageAction(queue, 'm1', 'send');
  assert.equal(sendResult.status, 'sent');
  assert.equal(sendResult.remainingQueue.length, 1);
  assert.equal(sendResult.remainingQueue[0].id, 'm2');

  const editResult = processMessageAction(queue, 'm2', 'edit', 'نص معدل بالكامل');
  assert.equal(editResult.status, 'edited');
  assert.equal(editResult.processedMessage?.aiMessagePreview, 'نص معدل بالكامل');
});
