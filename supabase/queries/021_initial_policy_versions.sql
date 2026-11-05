-- Initial product-specific policy drafts. They are deliberately marked as drafts;
-- an administrator must review and publish them before public visitors can see them.
insert into public.policy_versions (document_id, title, content_markdown, status)
select d.id, v.title, v.content_markdown, 'draft'
from public.policy_documents d
join (values
  ('privacy-policy', 'Cart2Class Privacy Policy', $$## Educational purpose

Cart2Class is an educational platform that helps families, schools, teachers, store partners and A.L.M.A. administrators deliver grocery-based reading and mathematics missions. This draft requires owner and legal review before publication.

## Information we process

We process account and contact information for parents/guardians, teachers, school staff and store representatives; minimum student profile details, class membership, learning progress, mission responses and teacher feedback; protected reading recordings; QR credentials and check-in records; and technical/security information needed to operate and protect the service. We use this information to authenticate users, deliver missions, show authorized progress, administer rewards, support users and prevent misuse.

## Access, sharing and storage

Cart2Class uses role-based access controls: parents see linked children, teachers see assigned classes, stores receive aggregate information only, and authorized administrators manage the program. Supabase and other service providers may process information solely to operate the service. We do not sell children’s data, use advertising directed at children, or use third-party behavioral tracking for children.

## Children, retention and choices

Schools and parents/guardians are responsible for supplying appropriate authorization for student records. We retain information only for the educational, security and legal purposes described by the approved policy. A verified deletion request can be submitted through the public Data Deletion page. International processing, retention periods, privacy contacts and any applicable legal obligations must be confirmed by the product owner before publication.$$),
  ('terms-and-conditions', 'Cart2Class Terms & Conditions', $$## Draft terms for review

By using Cart2Class, you agree to these terms once they have been reviewed and published. Users must provide accurate account information, protect their credentials, and use the platform only for authorized educational and program purposes.

Parents/guardians are responsible for their linked child accounts and consents. Schools and teachers are responsible for appropriate assignment, review and supervision of learning content. Store partners may use only their authorized location, check-in and aggregate reward tools. QR codes must not be copied, shared or used to obtain access outside the intended program.

Mission content, platform design and intellectual property remain protected by their respective owners. Users retain rights in their permitted submissions while granting Cart2Class the limited right to host and process them for the service. Reading recordings and student materials must never be publicly shared.

We may suspend access for misuse, security concerns or program changes. The service may rely on third-party infrastructure and may change or become unavailable. Liability, governing law, service contacts and final commercial terms require owner/legal confirmation before publication.$$),
  ('data-deletion', 'Data Deletion Policy', $$## How to request deletion

Parents/guardians may request review of their account or linked-child data. Authorized school representatives may request review of student records. Users may request removal of a recording where appropriate. Use the form below and provide only the information needed to identify and verify the request.

We verify identity and authority before processing. Removing a parent account does not automatically remove a child’s school record where another guardian, school obligation, security need or applicable law requires retention. Verified requests are reviewed by an A.L.M.A. administrator, who may ask for limited additional information, record the decision and send confirmation.

Educational progress, audit/security data and backups may be retained for an appropriate period where required for lawful, safety, fraud-prevention or operational reasons, then removed through normal backup rotation. Exact timelines and the official privacy contact require owner/legal confirmation before publication.$$),
  ('child-safety', 'Child Safety', $$## Child-centered learning

Cart2Class is designed for supervised, age-appropriate learning. It does not provide public student profiles, unrestricted student-to-student communication, public sharing of recordings, advertising directed at children or GPS location tracking.

Parents/guardians, teachers and authorized administrators provide oversight according to their roles. Student recordings and learning information are protected by access controls and are available only to authorized users. We expect schools and families to report concerns through the official support channel once configured.

The platform includes account controls, least-privilege access and protected storage, but no technology removes every risk. Product owners must define the official reporting, safeguarding escalation and emergency contact process before this page is published.$$),
  ('acceptable-use', 'Acceptable Use', $$## Use Cart2Class responsibly

Use Cart2Class only for authorized educational activities. Do not share passwords, QR credentials, student recordings or private learning information. Do not attempt to bypass access controls, impersonate another person, upload harmful content, interfere with the service, scrape data, or use the platform for advertising or commercial exploitation.

Teachers and administrators must ensure missions are suitable for their assigned learners. Store partners must use aggregate information only and must not seek student-level data. We may restrict or suspend accounts that violate these rules or threaten the safety, privacy or security of the community.$$),
  ('about', 'About Cart2Class', $$## Everyday places, meaningful learning

Cart2Class connects families, educators, store partners and A.L.M.A. administrators through mission-based reading and mathematics activities inspired by everyday grocery experiences. Teachers create and guide learning missions, approved content can be distributed through secure QR codes, and families can follow only their linked learner’s progress.

The platform is built around supervised learning, privacy-aware data access and practical experiences rather than public social sharing. Official organization, program and partnership details should be added by an authorized administrator before publication.$$),
  ('contact', 'Contact Cart2Class', $$## Contact and support

For account, privacy, safety or program support, use the contact details published by your organization’s authorized Cart2Class administrator. Please do not include student passwords, QR tokens, full recordings or unnecessary sensitive information in an initial request.

Official support, privacy and safeguarding contact details have not yet been supplied for this development environment. An administrator must add verified contact information before this page is published.$$)
) as v(slug, title, content_markdown) on v.slug = d.slug
where not exists (select 1 from public.policy_versions existing where existing.document_id = d.id);
