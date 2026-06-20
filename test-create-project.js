async function run() {
  const baseURL = 'http://localhost:8000/api/v1';
  console.log('Logging in...');
  try {
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'pm@xyzinfra.com',
        password: 'Password@123'
      })
    });
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log('Login successful. Token acquired.');

    // 1. Create project without partnerSearchQuery
    console.log('Creating project...');
    const projectRes = await fetch(`${baseURL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        projectCode: `TEST-PRJ-${Date.now().toString(36).toUpperCase()}`,
        name: 'Test Project No Partner',
        startDate: new Date().toISOString().split('T')[0]
      })
    });

    const projectText = await projectRes.text();
    if (!projectRes.ok) {
      throw new Error(`Project creation failed: ${projectRes.status} ${projectText}`);
    }
    const project = JSON.parse(projectText);
    console.log('Project created successfully:', project.id);

    // 2. Create payment
    console.log('Creating payment...');
    const paymentRes = await fetch(`${baseURL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: project.id,
        planType: 'PER_BORING',
        boringsPurchased: 3,
        amountPaid: 15000,
        razorpayOrderId: `local_${project.id}_${Date.now()}`
      })
    });

    const paymentText = await paymentRes.text();
    if (!paymentRes.ok) {
      throw new Error(`Payment creation failed: ${paymentRes.status} ${paymentText}`);
    }
    const payment = JSON.parse(paymentText);
    console.log('Payment created successfully:', payment);
  } catch (err) {
    console.error(err.message);
  }
}

run();
