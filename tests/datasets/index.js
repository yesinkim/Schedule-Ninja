/**
 * Test Dataset Index
 * 모든 테스트 데이터셋을 통합하여 제공
 * Total: 100 test cases
 */

import koreanData from './korean.json' assert { type: 'json' };
import englishData from './english.json' assert { type: 'json' };
import edgeCasesData from './edge-cases.json' assert { type: 'json' };
import bookingsData from './bookings.json' assert { type: 'json' };
import globalEventsData from './global-events.json' assert { type: 'json' };
import miscData from './misc.json' assert { type: 'json' };

/**
 * 개별 데이터셋 export
 */
export const korean = koreanData.testCases;        // 20 cases
export const english = englishData.testCases;      // 15 cases
export const edgeCases = edgeCasesData.testCases;  // 20 cases
export const bookings = bookingsData.testCases;    // 15 cases
export const globalEvents = globalEventsData.testCases; // 20 cases
export const misc = miscData.testCases;            // 10 cases

/**
 * 전체 데이터셋 (모든 테스트 케이스 통합)
 * Total: 100 test cases
 */
export const allTestCases = [
    ...korean,
    ...english,
    ...edgeCases,
    ...bookings,
    ...globalEvents,
    ...misc
];

/**
 * 카테고리별 데이터셋
 */
export function getTestCasesByCategory(category) {
    return allTestCases.filter(tc => tc.category === category);
}

/**
 * 소스별 데이터셋
 */
export function getTestCasesBySource(source) {
    return allTestCases.filter(tc => tc.source.includes(source));
}

/**
 * 데이터셋 통계
 */
export const stats = {
    total: allTestCases.length,
    korean: korean.length,
    english: english.length,
    edgeCases: edgeCases.length,
    bookings: bookings.length,
    globalEvents: globalEvents.length,
    misc: misc.length,
    categories: [...new Set(allTestCases.map(tc => tc.category))],
    sources: [...new Set(allTestCases.map(tc => tc.source))]
};

// CommonJS 호환을 위한 default export
export default {
    korean,
    english,
    edgeCases,
    bookings,
    globalEvents,
    misc,
    allTestCases,
    getTestCasesByCategory,
    getTestCasesBySource,
    stats
};
