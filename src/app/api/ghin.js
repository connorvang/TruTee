const fetchGolferScores = async (ghinNumber) => {
  try {
    const response = await fetch(
      `https://api2.ghin.com/api/v1/golfers/${ghinNumber}/scores.json?source=GHINcom`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMzk4NDQ3Iiwic2NwIjoidXNlciIsImF1ZCI6bnVsbCwiaWF0IjoxNzM1MDA1MDAwLCJleHAiOjE3MzUwNDgyMDAsImp0aSI6IjQ2Mzk2ZDU4LWQxMWQtNDU1Yy1hM2UzLWRjZDViZGU3NjJkOSJ9.T1dMYFY6Botp2MaxUKpnXT0KQPO0AfsZmFA3Rq80UJ0',
          'Origin': 'https://www.ghin.com',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching golfer scores:', error);
    throw error;
  }
}

const fetchGolferDetails = async (ghinNumber) => {
  try {
    const response = await fetch(
      `https://api2.ghin.com/api/v1/golfers.json?status=Active&from_ghin=true&per_page=25&sorting_criteria=full_name&order=asc&page=1&golfer_id=${ghinNumber}&source=GHINcom`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMzk4NDQ3Iiwic2NwIjoidXNlciIsImF1ZCI6bnVsbCwiaWF0IjoxNzM1MDA1MDAwLCJleHAiOjE3MzUwNDgyMDAsImp0aSI6IjQ2Mzk2ZDU4LWQxMWQtNDU1Yy1hM2UzLWRjZDViZGU3NjJkOSJ9.T1dMYFY6Botp2MaxUKpnXT0KQPO0AfsZmFA3Rq80UJ0',
          'Origin': 'https://www.ghin.com',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching golfer details:', error);
    throw error;
  }
}

export { fetchGolferScores, fetchGolferDetails }; 