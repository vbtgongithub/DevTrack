
async function confirm() {
  const username = 'Varshithreddy8044';
  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
        }
      }
    }
  `;
  const payload = { query, variables: { username } };
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
confirm().catch(console.error);
