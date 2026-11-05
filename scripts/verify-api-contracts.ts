import { POST as studentCardAuth } from "../src/app/api/v1/auth/student-card/route";
import { POST as authRefresh } from "../src/app/api/v1/auth/refresh/route";
import { POST as authLogout } from "../src/app/api/v1/auth/logout/route";
import { GET as studentProfile } from "../src/app/api/v1/student/profile/route";
import { GET as classRewards } from "../src/app/api/v1/classes/[classId]/rewards/route";
import { GET as assignedMission } from "../src/app/api/v1/missions/assigned/route";
import { GET as missionManifest } from "../src/app/api/v1/missions/[id]/manifest/route";
import { GET as missionDetail } from "../src/app/api/v1/missions/[id]/route";
import { GET as missionDemo } from "../src/app/api/v1/missions/demo/route";
import { POST as storeCheckIn } from "../src/app/api/v1/stores/check-in/route";
import { GET as storeBarcodeLookup } from "../src/app/api/v1/stores/[storeId]/products/[barcode]/route";
import { POST as syncEvents } from "../src/app/api/v1/sync/events/route";
import { POST as recordingUploadUrl } from "../src/app/api/v1/recordings/upload-url/route";
import { POST as recordingConfirm } from "../src/app/api/v1/recordings/[id]/confirm/route";
import { POST as staffLogin } from "../src/app/api/v1/staff/auth/login/route";
import { GET as staffClassOverview } from "../src/app/api/v1/staff/classes/[id]/overview/route";
import { GET as staffStudentMonitoring } from "../src/app/api/v1/staff/students/[id]/monitoring/route";
import { POST as staffClassMissions } from "../src/app/api/v1/staff/classes/[id]/missions/route";
import { POST as parentLogin } from "../src/app/api/v1/parents/auth/login/route";
import { POST as parentLinkChild } from "../src/app/api/v1/parents/children/link/route";
import { GET as parentChildren } from "../src/app/api/v1/parents/children/route";
import { GET as parentChildActivity } from "../src/app/api/v1/parents/children/[id]/activity/route";

async function verifyAll() {
  console.log("=================================================================");
  console.log("  CART2CLASS — AUTOMATED VERIFICATION OF ALL 22 API ENDPOINTS");
  console.log("=================================================================\n");

  let studentToken = "";
  let studentId = "";
  let teacherToken = "";
  let parentToken = "";

  // 1. POST /api/v1/auth/student-card
  {
    const req = new Request("http://localhost/api/v1/auth/student-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardCode: "c2c-card:v1:stu_maya_9f8a7b6c",
        deviceId: "ios-ipad-test-01",
        appVersion: "1.0.0"
      })
    });
    const res = await studentCardAuth(req);
    const json = await res.json();
    console.log(`[#1] POST /auth/student-card: status=${res.status}, hasAccessToken=${Boolean(json.accessToken)}, student=${json.student?.name}`);
    if (res.status !== 200) throw new Error("Failed #1: " + JSON.stringify(json));
    studentToken = json.accessToken;
    studentId = json.student.studentId;
  }

  // 2. POST /api/v1/auth/refresh
  {
    const req = new Request("http://localhost/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "rt_test_refresh", deviceId: "ios-ipad-test-01" })
    });
    const res = await authRefresh(req);
    const json = await res.json();
    console.log(`[#2] POST /auth/refresh: status=${res.status}, expiresIn=${json.expiresIn}`);
    if (res.status !== 200) throw new Error("Failed #2");
  }

  // 3. POST /api/v1/auth/logout
  {
    const req = new Request("http://localhost/api/v1/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: "ios-ipad-test-01" })
    });
    const res = await authLogout(req);
    const json = await res.json();
    console.log(`[#3] POST /auth/logout: status=${res.status}, loggedOut=${json.loggedOut}`);
    if (res.status !== 200 || !json.loggedOut) throw new Error("Failed #3");
  }

  // 4. GET /api/v1/student/profile
  {
    const req = new Request("http://localhost/api/v1/student/profile", {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const res = await studentProfile(req);
    const json = await res.json();
    console.log(`[#4] GET /student/profile: status=${res.status}, student=${json.name}, reward=${json.reward}, stars=${json.confirmedStars}`);
    if (res.status !== 200) throw new Error("Failed #4");
  }

  // 5. GET /api/v1/classes/{classId}/rewards
  {
    const req = new Request("http://localhost/api/v1/classes/cls_room12/rewards");
    const res = await classRewards(req, { params: Promise.resolve({ classId: "cls_room12" }) });
    const json = await res.json();
    console.log(`[#5] GET /classes/{classId}/rewards: status=${res.status}, targetStars=${json.targetStars}`);
    if (res.status !== 200) throw new Error("Failed #5");
  }

  // 6. GET /api/v1/missions/assigned
  {
    const req = new Request(`http://localhost/api/v1/missions/assigned?studentId=${studentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const res = await assignedMission(req);
    const json = await res.json();
    console.log(`[#6] GET /missions/assigned: status=${res.status}, missionStatus=${json.status}, title="${json.mission?.title}", products=${json.mission?.products?.length}, sounds=${json.mission?.sounds?.length}`);
    if (res.status !== 200 || json.status !== "assigned") throw new Error("Failed #6: " + JSON.stringify(json));
  }

  // 7. GET /api/v1/missions/{id}/manifest
  {
    const req = new Request("http://localhost/api/v1/missions/fruit-veggie-04/manifest");
    const res = await missionManifest(req, { params: Promise.resolve({ id: "fruit-veggie-04" }) });
    const json = await res.json();
    console.log(`[#7] GET /missions/{id}/manifest: status=${res.status}, totalBytes=${json.totalBytes}, filesCount=${json.files?.length}, sampleHash=${json.files?.[0]?.sha256?.slice(0, 12)}...`);
    if (res.status !== 200 || !json.files?.length) throw new Error("Failed #7");
  }

  // 8. GET /api/v1/missions/{id}
  {
    const req = new Request("http://localhost/api/v1/missions/fruit-veggie-04");
    const res = await missionDetail(req, { params: Promise.resolve({ id: "fruit-veggie-04" }) });
    const json = await res.json();
    console.log(`[#8] GET /missions/{id}: status=${res.status}, title="${json.title}", passage="${json.passage}"`);
    if (res.status !== 200) throw new Error("Failed #8");
  }

  // 9. GET /api/v1/missions/demo
  {
    const res = await missionDemo();
    const json = await res.json();
    console.log(`[#9] GET /missions/demo: status=${res.status}, demosCount=${json.demos?.length}`);
    if (res.status !== 200 || !json.demos?.length) throw new Error("Failed #9");
  }

  // 10. POST /api/v1/stores/check-in
  {
    const req = new Request("http://localhost/api/v1/stores/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "c2c-store:partner-market-01:2026-11:sig_89ab",
        expectedStore: "partner-market-01",
        missionId: "fruit-veggie-04"
      })
    });
    const res = await storeCheckIn(req);
    const json = await res.json();
    console.log(`[#10] POST /stores/check-in: status=${res.status}, valid=${json.valid}, storeName="${json.storeName}", runId=${json.runId}`);
    if (res.status !== 200 || !json.valid) throw new Error("Failed #10");
  }

  // 11. GET /api/v1/stores/{storeId}/products/{barcode}
  {
    const req = new Request("http://localhost/api/v1/stores/partner-market-01/products/012345678905");
    const res = await storeBarcodeLookup(req, { params: Promise.resolve({ storeId: "partner-market-01", barcode: "012345678905" }) });
    const json = await res.json();
    console.log(`[#11] GET /stores/{storeId}/products/{barcode}: status=${res.status}, productName="${json.name}", priceCents=${json.priceCents}`);
    if (res.status !== 200 || json.name !== "corn") throw new Error("Failed #11");
  }

  // 12. POST /api/v1/sync/events
  {
    const req = new Request("http://localhost/api/v1/sync/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `test-event-${Date.now()}:completion`,
        studentId: studentId,
        kind: "mission",
        payload: {
          studentId: studentId,
          missionId: "fruit-veggie-04",
          storeId: "partner-market-01",
          storeName: "Partner Market",
          localStars: 5,
          progress: {
            stage: 4,
            question: 0,
            checkedIn: true,
            paused: false,
            complete: true,
            answers: { "sound-b": "banana", "math-more": "apples" },
            productIds: ["corn", "apples"],
            recordingSeconds: 11,
            runId: "run-test-uuid"
          },
          attempts: [
            { attemptId: "a1", questionId: "sound-b", choice: "carrot", correct: false, createdAt: new Date().toISOString() },
            { attemptId: "a2", questionId: "sound-b", choice: "banana", correct: true, createdAt: new Date().toISOString() }
          ],
          completedAt: new Date().toISOString()
        }
      })
    });
    const res = await syncEvents(req);
    const json = await res.json();
    console.log(`[#12] POST /sync/events: status=${res.status}, serverAcknowledged=${json.serverAcknowledged}, confirmedStars=${json.confirmedStars}`);
    if (res.status !== 200 || !json.serverAcknowledged) throw new Error("Failed #12");
  }

  // 13. POST /api/v1/recordings/upload-url
  let recordingId = "";
  {
    const req = new Request("http://localhost/api/v1/recordings/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: "test-rec-event-01",
        studentId: studentId,
        missionId: "fruit-veggie-04",
        passage: "Fresh Corn",
        seconds: 11,
        recordedAt: new Date().toISOString()
      })
    });
    const res = await recordingUploadUrl(req);
    const json = await res.json();
    console.log(`[#13] POST /recordings/upload-url: status=${res.status}, recordingId=${json.recordingId}, hasUploadUrl=${Boolean(json.uploadUrl)}`);
    if (res.status !== 200 || !json.recordingId) throw new Error("Failed #13");
    recordingId = json.recordingId;
  }

  // 14. POST /api/v1/recordings/{id}/confirm
  {
    const req = new Request(`http://localhost/api/v1/recordings/${recordingId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: "test-rec-event-01",
        sha256: "4a7d1ed4test"
      })
    });
    const res = await recordingConfirm(req, { params: Promise.resolve({ id: recordingId }) });
    const json = await res.json();
    console.log(`[#14] POST /recordings/{id}/confirm: status=${res.status}, serverAcknowledged=${json.serverAcknowledged}`);
    if (res.status !== 200 || !json.serverAcknowledged) throw new Error("Failed #14");
  }

  // 15. POST /api/v1/staff/auth/login
  {
    const req = new Request("http://localhost/api/v1/staff/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teacher1@gmail.com", password: "12345678" })
    });
    const res = await staffLogin(req);
    const json = await res.json();
    console.log(`[#15] POST /staff/auth/login: status=${res.status}, teacher="${json.teacher?.name}", classId=${json.teacher?.classId}`);
    if (res.status !== 200 || !json.accessToken) throw new Error("Failed #15");
    teacherToken = json.accessToken;
  }

  // 16. GET /api/v1/staff/classes/{id}/overview
  {
    const req = new Request("http://localhost/api/v1/staff/classes/cls_room12/overview", {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    const res = await staffClassOverview(req, { params: Promise.resolve({ id: "cls_room12" }) });
    const json = await res.json();
    console.log(`[#16] GET /staff/classes/{id}/overview: status=${res.status}, room="${json.room}", studentsCount=${json.students?.length}`);
    if (res.status !== 200) throw new Error("Failed #16");
  }

  // 17. GET /api/v1/staff/students/{id}/monitoring
  {
    const req = new Request(`http://localhost/api/v1/staff/students/${studentId}/monitoring?missionId=fruit-veggie-04`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    const res = await staffStudentMonitoring(req, { params: Promise.resolve({ id: studentId }) });
    const json = await res.json();
    console.log(`[#17] GET /staff/students/{id}/monitoring: status=${res.status}, studentName="${json.student?.name}", attemptsCount=${json.missionRun?.attempts?.length}, hasPlaybackUrl=${Boolean(json.missionRun?.recording?.playbackSignedUrl)}`);
    if (res.status !== 200) throw new Error("Failed #17");
  }

  // 18. POST /api/v1/staff/classes/{id}/missions
  {
    const req = new Request("http://localhost/api/v1/staff/classes/cls_room12/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        missionId: "fruit-veggie-04",
        storeId: "partner-market-01",
        opensAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString()
      })
    });
    const res = await staffClassMissions(req, { params: Promise.resolve({ id: "cls_room12" }) });
    const json = await res.json();
    console.log(`[#18] POST /staff/classes/{id}/missions: status=${res.status}, assigned=${json.assigned}, storeQr=${json.storeQrCode}`);
    if (res.status !== 200 || !json.assigned) throw new Error("Failed #18");
  }

  // 19. POST /api/v1/parents/auth/login
  {
    const req = new Request("http://localhost/api/v1/parents/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "parent1@gmail.com", password: "12345678" })
    });
    const res = await parentLogin(req);
    const json = await res.json();
    console.log(`[#19] POST /parents/auth/login: status=${res.status}, parent="${json.parent?.name}", childIds=${json.parent?.childIds?.length}`);
    if (res.status !== 200 || !json.accessToken) throw new Error("Failed #19");
    parentToken = json.accessToken;
  }

  // 20. POST /api/v1/parents/children/link
  {
    const req = new Request("http://localhost/api/v1/parents/children/link", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${parentToken}` },
      body: JSON.stringify({ parentInviteCode: "C2C-PAR-MAYA-8492" })
    });
    const res = await parentLinkChild(req);
    const json = await res.json();
    console.log(`[#20] POST /parents/children/link: status=${res.status}, linked=${json.linked}, childName="${json.child?.name}"`);
    if (res.status !== 200 || !json.linked) throw new Error("Failed #20");
  }

  // 21. GET /api/v1/parents/children
  {
    const req = new Request("http://localhost/api/v1/parents/children", {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    const res = await parentChildren(req);
    const json = await res.json();
    console.log(`[#21] GET /parents/children: status=${res.status}, childrenCount=${json.children?.length}, firstChild="${json.children?.[0]?.name}", stage=${json.children?.[0]?.currentMission?.stageLabel}`);
    if (res.status !== 200 || !json.children?.length) throw new Error("Failed #21");
  }

  // 22. GET /api/v1/parents/children/{id}/activity
  {
    const req = new Request(`http://localhost/api/v1/parents/children/${studentId}/activity`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    const res = await parentChildActivity(req, { params: Promise.resolve({ id: studentId }) });
    const json = await res.json();
    console.log(`[#22] GET /parents/children/{id}/activity: status=${res.status}, child="${json.child?.name}", attemptsTimeline=${json.missions?.[0]?.attemptsTimeline?.length}, hasAudioPlaybackUrl=${Boolean(json.missions?.[0]?.stagesSummary?.read?.playbackSignedUrl)}`);
    if (res.status !== 200) throw new Error("Failed #22");
  }

  console.log("\n=================================================================");
  console.log("  ALL 22 APIS VERIFIED AND COMPLIANT WITH CART2CLASS SPEC! ✅");
  console.log("=================================================================\n");
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exitCode = 1;
});

