/**
 * Simple test script to verify API functionality
 */

// Test creating employees and shifts through direct API calls
const testAPI = async () => {
  try {
    // Test basic connection
    const response = await fetch('http://localhost:3001/api/auth/signin', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('API Connection test:', response.status)
    
    // Check if we can access without auth for debugging
    const employeesResponse = await fetch('http://localhost:3001/api/employees', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const employeesData = await employeesResponse.json()
    console.log('Employees API response:', employeesData)
    
    const shiftsResponse = await fetch('http://localhost:3001/api/shifts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const shiftsData = await shiftsResponse.json()
    console.log('Shifts API response:', shiftsData)
    
  } catch (error) {
    console.error('API test error:', error)
  }
}

testAPI()