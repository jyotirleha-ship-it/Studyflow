import User from '../models/User.js';
import StudyGroup from '../models/StudyGroup.js';
import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import Assessment from '../models/Assessment.js';

export const initCollaborationSeed = async () => {
  try {
    const studentCount = await User.countDocuments({ role: 'user' });
    
    // Check if demo students exist
    const arun = await User.findOne({ email: 'arun@studyflow.ai' });
    if (!arun) {
      console.log('[Seed] Populating initial collaborative peer students & study cohorts...');

      const sampleStudents = [
        {
          name: 'Arun Kumar',
          email: 'arun@studyflow.ai',
          password: 'password123',
          department: 'Computer Science',
          year: '3rd Year',
          performanceLevel: 'Medium',
          studyHoursPerDay: 3,
          interestedSubjects: ['DBMS', 'SQL', 'Algorithms'],
          studyGoals: 'Master DB Normalization, Indexing & Query Optimization',
          xp: 450,
          level: 2
        },
        {
          name: 'Priya Sharma',
          email: 'priya@studyflow.ai',
          password: 'password123',
          department: 'Computer Science',
          year: '3rd Year',
          performanceLevel: 'High',
          studyHoursPerDay: 3.5,
          interestedSubjects: ['Java', 'DBMS', 'Web Development'],
          studyGoals: 'Ace University Exams & System Design Principles',
          xp: 820,
          level: 4
        },
        {
          name: 'Rahul Varma',
          email: 'rahul@studyflow.ai',
          password: 'password123',
          department: 'Information Technology',
          year: '3rd Year',
          performanceLevel: 'Medium',
          studyHoursPerDay: 2.5,
          interestedSubjects: ['DBMS', 'Operating Systems', 'Data Structures'],
          studyGoals: 'Placement Preparation & Core CS Foundations',
          xp: 390,
          level: 2
        },
        {
          name: 'Sneha Patel',
          email: 'sneha@studyflow.ai',
          password: 'password123',
          department: 'Computer Science',
          year: '4th Year',
          performanceLevel: 'High',
          studyHoursPerDay: 4,
          interestedSubjects: ['Blockchain', 'Java', 'Cryptography'],
          studyGoals: 'Decentralized Applications & Smart Contracts',
          xp: 950,
          level: 5
        },
        {
          name: 'Vikram Singh',
          email: 'vikram@studyflow.ai',
          password: 'password123',
          department: 'Electronics',
          year: '2nd Year',
          performanceLevel: 'Needs Attention',
          studyHoursPerDay: 1.5,
          interestedSubjects: ['C Programming', 'Microprocessors'],
          studyGoals: 'Improve study consistency and semester grading',
          xp: 180,
          level: 1
        }
      ];

      const createdUsers = [];
      for (const s of sampleStudents) {
        const u = await User.create(s);
        createdUsers.push(u);
      }

      const arunUser = createdUsers[0];
      const priyaUser = createdUsers[1];
      const rahulUser = createdUsers[2];
      const snehaUser = createdUsers[3];

      // Create Sample Study Groups
      const groups = [
        {
          name: 'DBMS Group',
          subject: 'DBMS',
          description: 'Deep dive into Relational Algebra, SQL Normalization (1NF to BCNF), and ACID transactions.',
          creator: arunUser._id,
          members: [
            { user: arunUser._id, role: 'admin' },
            { user: rahulUser._id, role: 'member' },
            { user: priyaUser._id, role: 'member' }
          ],
          announcements: [{
            title: 'Normalization Practice Session',
            content: 'Join our shared revision on BCNF decomposition rules this Thursday at 6:00 PM!',
            author: arunUser._id
          }]
        },
        {
          name: 'Java Group',
          subject: 'Java',
          description: 'Master Object-Oriented Programming, Collections, Multithreading, and Spring Framework.',
          creator: priyaUser._id,
          members: [
            { user: priyaUser._id, role: 'admin' },
            { user: arunUser._id, role: 'member' }
          ],
          announcements: [{
            title: 'Design Patterns Checklist',
            content: 'Check out the Singleton and Factory pattern notes in our Shared Notes tab.',
            author: priyaUser._id
          }]
        },
        {
          name: 'Placement Group',
          subject: 'Placement',
          description: 'Aptitude tests, Data Structures & Algorithms, System Design mock interviews, and resume prep.',
          creator: rahulUser._id,
          members: [
            { user: rahulUser._id, role: 'admin' },
            { user: priyaUser._id, role: 'member' },
            { user: snehaUser._id, role: 'member' }
          ],
          announcements: [{
            title: 'Top 50 LeetCode Patterns',
            content: 'Two-pointer and Sliding Window practice problems scheduled for this weekend.',
            author: rahulUser._id
          }]
        },
        {
          name: 'Blockchain Group',
          subject: 'Blockchain',
          description: 'Explore Distributed Ledgers, Smart Contracts, Ethereum Virtual Machine (EVM), and Solidity.',
          creator: snehaUser._id,
          members: [
            { user: snehaUser._id, role: 'admin' }
          ],
          announcements: [{
            title: 'Consensus Algorithms Overview',
            content: 'PoW vs PoS comparison slides and notes uploaded!',
            author: snehaUser._id
          }]
        }
      ];

      for (const g of groups) {
        await StudyGroup.create(g);
      }

      // Create sample subject for Arun to link note
      let arunSubject = await Subject.findOne({ user: arunUser._id, name: 'DBMS' });
      if (!arunSubject) {
        arunSubject = await Subject.create({
          user: arunUser._id,
          name: 'DBMS',
          code: 'CS301',
          color: '#3b82f6',
          icon: 'Database',
          priority: 'high'
        });
      }

      // Sample Shared Note
      await Note.create({
        user: arunUser._id,
        sharedBy: arunUser._id,
        subject: arunSubject._id,
        subjectName: 'DBMS',
        topicName: 'Normalization',
        title: 'Normalization (1NF to BCNF) Master Notes',
        content: `### Normalization in Relational Database Management Systems

**Shared By:** Arun Kumar
**Subject:** DBMS
**Topic:** Normalization

#### 1NF (First Normal Form)
- Each column must contain atomic (indivisible) values.
- No repeating groups or arrays stored in single attributes.

#### 2NF (Second Normal Form)
- Must already satisfy 1NF.
- No partial dependency: Every non-prime attribute must depend on the whole candidate key, not a subset.

#### 3NF (Third Normal Form)
- Must already satisfy 2NF.
- No transitive dependency: Non-prime attributes must not determine other non-prime attributes.
- Condition: For every X -> Y, either X is a super key or Y is a prime attribute.

#### BCNF (Boyce-Codd Normal Form)
- Stricter form of 3NF.
- For every non-trivial functional dependency X -> Y, X must be a super key.`,
        tags: ['DBMS', 'Normalization', 'Relational Model', 'BCNF'],
        isShared: true,
        sharedWith: [priyaUser._id, rahulUser._id]
      });

      console.log('[Seed] Sample collaborative peers and study groups initialized successfully.');
    }

    // Ensure sample assessments exist
    const assessmentCount = await Assessment.countDocuments();
    if (assessmentCount === 0) {
      await Assessment.create({
        title: 'DBMS Normalization & Relational Theory Assessment',
        subject: 'DBMS',
        difficulty: 'Medium',
        durationMinutes: 25,
        totalQuestions: 5,
        passingScore: 60,
        questions: [
          {
            question: 'Which normal form eliminates partial dependencies on candidate keys?',
            options: ['1NF', '2NF', '3NF', 'BCNF'],
            correctOptionIndex: 1,
            explanation: '2NF requires that all non-prime attributes are fully functionally dependent on the complete primary key.'
          },
          {
            question: 'In BCNF, for every functional dependency X -> Y, what must X be?',
            options: ['Prime attribute', 'Foreign key', 'Super key', 'Composite key'],
            correctOptionIndex: 2,
            explanation: 'Boyce-Codd Normal Form strictly demands that the left-hand side X is a super key.'
          },
          {
            question: 'What is the primary drawback of decomposing a table into BCNF?',
            options: ['Loss of atomicity', 'Loss of dependency preservation', 'Duplicate tuples', 'Increased disk usage'],
            correctOptionIndex: 1,
            explanation: 'Some dependencies may not be preserved when decomposing certain relations into BCNF.'
          },
          {
            question: 'Which ACID property guarantees that a database transaction is completed entirely or not at all?',
            options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
            correctOptionIndex: 0,
            explanation: 'Atomicity ensures all-or-nothing execution of transactions.'
          },
          {
            question: 'Which index structure is standard for range queries in relational database systems?',
            options: ['Hash Index', 'B+ Tree Index', 'Bitmap Index', 'Inverted Index'],
            correctOptionIndex: 1,
            explanation: 'B+ Tree indexes store keys in sorted order with linked leaf nodes, making range queries optimal.'
          }
        ]
      });

      await Assessment.create({
        title: 'Java Object-Oriented Principles & Collections Evaluation',
        subject: 'Java',
        difficulty: 'Medium',
        durationMinutes: 20,
        totalQuestions: 4,
        passingScore: 70,
        questions: [
          {
            question: 'Which OOP principle involves hiding internal implementation details and exposing only essential interfaces?',
            options: ['Polymorphism', 'Inheritance', 'Encapsulation', 'Abstraction'],
            correctOptionIndex: 2,
            explanation: 'Encapsulation restricts direct access to an object components and bundles data with methods.'
          },
          {
            question: 'Which Java Collection implementation guarantees sorted iteration order of elements?',
            options: ['HashSet', 'TreeSet', 'ArrayList', 'HashMap'],
            correctOptionIndex: 1,
            explanation: 'TreeSet implements NavigableSet backed by a Red-Black tree, ensuring sorted order.'
          },
          {
            question: 'Can an interface in Java 8+ have concrete method implementations?',
            options: ['No, never', 'Yes, using default and static keywords', 'Only if declared abstract', 'Only private methods'],
            correctOptionIndex: 1,
            explanation: 'Java 8 introduced default and static methods in interfaces with full method bodies.'
          },
          {
            question: 'What happens when an uncaught RuntimeException occurs in a Java thread?',
            options: ['JVM crashes immediately', 'Thread terminates, printing stack trace', 'Garbage collector triggers', 'Thread restarts automatically'],
            correctOptionIndex: 1,
            explanation: 'The thread terminates and the default UncaughtExceptionHandler outputs the stack trace.'
          }
        ]
      });
      console.log('[Seed] Sample assessments created.');
    }
  } catch (err) {
    console.error('[Collaboration Seed Warning]', err.message);
  }
};
