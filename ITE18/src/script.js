document.addEventListener('DOMContentLoaded', () => {
	// Galaxy (Particle) Section
	const particleCanvas = document.querySelector('#particleCanvas');
	const particleScene = new THREE.Scene();
	const particleCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
	const particleRenderer = new THREE.WebGLRenderer({ canvas: particleCanvas });
	particleRenderer.setSize(window.innerWidth, window.innerHeight * 0.7);

	particleCamera.position.z = 3;

	const particleGeometry = new THREE.BufferGeometry();
	const particleCount = 10000;
	const positions = new Float32Array(particleCount * 3);
	const colors = new Float32Array(particleCount * 3);

	for (let i = 0; i < particleCount; i++) {
	  const i3 = i * 3;
	  const radius = Math.random() * 5;
	  const angle = Math.random() * Math.PI * 2;

	  positions[i3] = Math.cos(angle) * radius;
	  positions[i3 + 1] = (Math.random() - 0.5) * 5;
	  positions[i3 + 2] = Math.sin(angle) * radius;

	  // Initialize with default color (white)
	  colors[i3] = 1;
	  colors[i3 + 1] = 1;
	  colors[i3 + 2] = 1;
	}

	particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

	const particleMaterial = new THREE.PointsMaterial({
	  size: 0.02,
	  vertexColors: true, // Allow vertex colors
	});

	const particles = new THREE.Points(particleGeometry, particleMaterial);
	particleScene.add(particles);

	function animateParticles() {
	  particles.rotation.y += 0.002;
	  particleRenderer.render(particleScene, particleCamera);
	  requestAnimationFrame(animateParticles);
	}
	animateParticles();

	// Color Change Logic
	const color1Input = document.querySelector('#color1');
	const color2Input = document.querySelector('#color2');
	const color3Input = document.querySelector('#color3');
	const applyColorButton = document.querySelector('#applyColor');

	applyColorButton.addEventListener('click', () => {
	  const color1 = new THREE.Color(color1Input.value);
	  const color2 = new THREE.Color(color2Input.value);
	  const color3 = new THREE.Color(color3Input.value);

	  for (let i = 0; i < particleCount; i++) {
		const i3 = i * 3;

		// Calculate color blend for each particle
		const t = Math.random(); // Random blend factor
		const blendedColor = color1.clone().lerp(color2, t).lerp(color3, Math.random());

		colors[i3] = blendedColor.r;
		colors[i3 + 1] = blendedColor.g;
		colors[i3 + 2] = blendedColor.b;
	  }

	  particleGeometry.attributes.color.needsUpdate = true; // Notify Three.js to update colors
	});

	// Physics Section
	const physicsCanvas = document.querySelector('#physicsCanvas');
	const physicsScene = new THREE.Scene();
	const physicsCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
	const physicsRenderer = new THREE.WebGLRenderer({ canvas: physicsCanvas });
	physicsRenderer.setSize(window.innerWidth, window.innerHeight * 0.7);

	physicsCamera.position.set(0, 5, 15);

	const world = new CANNON.World();
	world.gravity.set(0, -9.82, 0);

	// Flat Surface
	const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
	const ground = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), groundMaterial);
	ground.position.set(0, -0.5, 0);
	physicsScene.add(ground);

	const groundBody = new CANNON.Body({
	  mass: 0,
	  shape: new CANNON.Box(new CANNON.Vec3(5, 0.5, 5)),
	  position: new CANNON.Vec3(0, -0.5, 0),
	});
	world.addBody(groundBody);

	// Falling Boxes
	const boxMeshes = [];
	const boxBodies = [];
	const initialBoxPositions = [];
	const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff5533 });

	for (let i = 0; i < 3; i++) {
	  const initialPosition = new CANNON.Vec3(i * 0.5, 5 + i * 2, 0);

	  const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), boxMaterial);
	  boxMesh.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
	  physicsScene.add(boxMesh);
	  boxMeshes.push(boxMesh);

	  const boxBody = new CANNON.Body({
		mass: 1,
		shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
		position: initialPosition.clone(),
	  });
	  world.addBody(boxBody);
	  boxBodies.push(boxBody);

	  initialBoxPositions.push(initialPosition.clone());
	}

	// Lighting
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5, 10, 5);
	physicsScene.add(light);

	function animatePhysics() {
	  world.step(1 / 60);

	  for (let i = 0; i < boxBodies.length; i++) {
		boxMeshes[i].position.copy(boxBodies[i].position);
		boxMeshes[i].quaternion.copy(boxBodies[i].quaternion);
	  }

	  physicsRenderer.render(physicsScene, physicsCamera);
	  requestAnimationFrame(animatePhysics);
	}
	animatePhysics();

	// Reset Button Logic
	const resetButton = document.querySelector('#resetPhysics');
	resetButton.addEventListener('click', () => {
	  for (let i = 0; i < boxBodies.length; i++) {
		// Reset positions
		boxBodies[i].position.copy(initialBoxPositions[i]);
		boxBodies[i].quaternion.set(0, 0, 0, 1);

		// Reset velocities
		boxBodies[i].velocity.set(0, 0, 0);
		boxBodies[i].angularVelocity.set(0, 0, 0);

		// Sync meshes
		boxMeshes[i].position.copy(initialBoxPositions[i]);
		boxMeshes[i].quaternion.set(0, 0, 0, 1);
	  }
	});

	// Resize Handler
	window.addEventListener('resize', () => {
	  particleRenderer.setSize(window.innerWidth, window.innerHeight * 0.7);
	  particleCamera.aspect = window.innerWidth / window.innerHeight;
	  particleCamera.updateProjectionMatrix();

	  physicsRenderer.setSize(window.innerWidth, window.innerHeight * 0.7);
	  physicsCamera.aspect = window.innerWidth / window.innerHeight;
	  physicsCamera.updateProjectionMatrix();
	});
  });