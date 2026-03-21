// Using built-in fetch (available in Node 18+)
async function testLeetCodeRecent(username) {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        title
        titleSlug
        timestamp
      }
    }
  `;

  try {
    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: query,
        variables: { username, limit: 5 },
      }),
    });

    const data = await response.json();
    console.log('LeetCode Response structure:', Object.keys(data));
    
    if (data.data && data.data.recentAcSubmissionList) {
        data.data.recentAcSubmissionList.forEach(s => {
            console.log(`Problem: ${s.title}, Timestamp: ${s.timestamp}, Type: ${typeof s.timestamp}`);
        });
    } else {
        console.log('No data returned or errors:', data.errors);
    }
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testLeetCodeRecent('leetcode'); 
