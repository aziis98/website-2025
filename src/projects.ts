export async function getProjectsData() {
    const { default: langColors } = await import('@/assets/github-language-colors.json')

    const technologies: Record<
        string,
        {
            icon: string
            url?: string
            color?: string
        }
    > = {
        ['Go']: {
            icon: 'simple-icons:go',
            url: 'https://go.dev/',
            color: langColors['Go'].color,
        },
        ['Python']: {
            icon: 'simple-icons:python',
            url: 'https://www.python.org/',
            color: langColors['Python'].color,
        },
        ['Rust']: {
            icon: 'simple-icons:rust',
            url: 'https://www.rust-lang.org/',
            color: langColors['Rust'].color,
        },
        ['C']: {
            icon: 'simple-icons:c',
            url: 'https://en.wikipedia.org/wiki/C_(programming_language)',
            color: langColors['C'].color,
        },
        ['HTML']: {
            icon: 'logos:html-5',
            url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
            color: langColors['HTML'].color,
        },
        ['CSS']: {
            icon: 'vscode-icons:file-type-css',
            url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
            color: langColors['CSS'].color,
        },
        ['JavaScript']: {
            icon: 'simple-icons:javascript',
            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
            color: langColors['JavaScript'].color,
        },
        ['TypeScript']: {
            icon: 'simple-icons:typescript',
            url: 'https://www.typescriptlang.org/',
            color: langColors['TypeScript'].color,
        },
        ['Astro']: {
            icon: 'simple-icons:astro',
            url: 'https://astro.build/',
            color: langColors['Astro'].color,
        },
        ['Lean']: {
            icon: 'vscode-icons:file-type-light-lean',
            url: 'https://leanprover.github.io/',
            color: langColors['Lean 4'].color,
        },
        ['Docker']: {
            icon: 'simple-icons:docker',
            url: 'https://www.docker.com/',
            color: langColors['Dockerfile'].color,
        },
        ['Typst']: {
            icon: 'simple-icons:typst',
            url: 'https://typst.app/',
            color: langColors['Typst'].color,
        },
        ['Julia']: {
            icon: 'vscode-icons:file-type-julia',
            url: 'https://julialang.org/',
        },

        // Other
        ['NodeJS']: {
            icon: 'logos:nodejs',
            url: 'https://nodejs.org/',
        },
        ['ViteJS']: {
            icon: 'logos:vitejs',
            url: 'https://vitejs.dev/',
        },
        ['ThreeJS']: {
            icon: 'logos:threejs',
            url: 'https://threejs.org/',
        },
        ['Preact']: {
            icon: 'logos:preact',
            url: 'https://preactjs.com/',
        },
        ['SQLite']: {
            icon: 'vscode-icons:file-type-sqlite',
            url: 'https://www.sqlite.org/index.html',
        },
    }

    const githubRepoDetails: {
        html_url: string
        full_name: string
        description: string
        topics?: string[]
        stargazers_count: number
        forks_count: number
        technologies?: string[]
    }[] = [
        {
            html_url: 'https://github.com/gdgpisa/devfest-2025',
            full_name: 'gdgpisa/devfest-2025',
            description: 'New website for GDG DevFest 2025 made from scratch in Astro',
            topics: ['astro', 'gdg', 'gdg-devfest', 'pisa', 'website'],
            stargazers_count: 4,
            forks_count: 1,
            technologies: ['Astro'],
        },
        {
            html_url: 'https://github.com/aziis98/kauffman-polynomial',
            full_name: 'aziis98/kauffman-polynomial',
            description:
                'Course Project: Computational Laboratory - Implementation of the knot theory Kauffman polynomial regular isotopy invariant in Python',
            topics: ['homfly', 'invariants', 'kauffman-polynomial', 'knot-theory', 'python', 'sympy', 'uv'],
            stargazers_count: 2,
            forks_count: 0,
            technologies: ['Python', 'Typst'],
        },
        {
            html_url: 'https://github.com/aziis98/mup',
            full_name: 'aziis98/mup',
            description: 'A micro file uploader written in Go to easily share files over LAN',
            topics: [],
            stargazers_count: 176,
            forks_count: 6,
            technologies: ['Go'],
        },
        {
            html_url: 'https://github.com/Unipisa/dm-planimetrie',
            full_name: 'Unipisa/dm-planimetrie',
            description: 'Floor plan project for the Department of Mathematics at the University of Pisa',
            topics: ['threejs', 'sketchup', 'vite'],
            stargazers_count: 1,
            forks_count: 0,
            technologies: ['ViteJS', 'ThreeJS', 'Preact'],
        },
        {
            html_url: 'https://github.com/aziis98/opencv-maze-solver',
            full_name: 'aziis98/opencv-maze-solver',
            description:
                'Summer project before vacation, an OpenCV-powered whiteboard maze solver (A* by NetworkX) with start/end points decided by April Tags',
            topics: ['apriltags', 'networkx', 'opencv', 'python', 'summer-project', 'whiteboard'],
            stargazers_count: 1,
            forks_count: 0,
            technologies: ['Python'],
        },
        {
            html_url: 'https://github.com/aziis98/asd-2024',
            full_name: 'aziis98/asd-2024',
            description:
                'Course Project: Algorithms and Data Structures - pangenome graphs, gfa parsing, analysis and visualization',
            topics: ['algorithms-and-data-structures', 'gfa', 'graphs', 'macroquad', 'visualization'],
            stargazers_count: 1,
            forks_count: 0,
            technologies: ['Rust'],
        },
        {
            html_url: 'https://github.com/aziis98/arnoldi-distribuito',
            full_name: 'aziis98/arnoldi-distribuito',
            description:
                'Course Project: Scientific Computing, HPC - Distributed Arnoldi Iteration for Eigenvalues with PETSc in C',
            topics: ['distributed', 'hpc', 'mpi', 'petsc', 'scientific-computing'],
            stargazers_count: 3,
            forks_count: 1,
            technologies: ['C', 'Julia', 'Typst'],
        },
        {
            html_url: 'https://github.com/aziis98/go-stats-server',
            full_name: 'aziis98/go-stats-server',
            description: 'A small tcp server for monitoring a node in a cluster',
            topics: [],
            stargazers_count: 2,
            forks_count: 0,
            technologies: ['Go'],
        },
    ]

    const phcGiteaRepoDetails: {
        html_url: string
        full_name: string
        description: string
        technologies: string[]
    }[] = [
        {
            html_url: 'https://git.phc.dm.unipi.it/phc/website',
            full_name: 'phc/website',
            description: 'New website for the PHC',
            technologies: ['Astro'],
        },
        {
            html_url: 'https://git.phc.dm.unipi.it/phc/orario',
            full_name: 'phc/orario',
            description: 'Static website to display class schedules and create custom timetables',
            technologies: ['ViteJS', 'Preact'],
        },
        {
            html_url: 'https://git.phc.dm.unipi.it/phc/problemi',
            full_name: 'phc/problemi',
            description: 'Problem board website and the ability to submit solutions in markdown and latex',
            technologies: ['HTML', 'CSS', 'Preact', 'NodeJS'],
        },
        {
            html_url: 'https://git.phc.dm.unipi.it/aziis98/ggwp',
            full_name: 'aziis98/ggwp',
            description: 'Scoreboard for the GGWP competition',
            technologies: ['Astro', 'SQLite'],
        },
        {
            html_url: 'https://git.phc.dm.unipi.it/phc/magma_kernel',
            full_name: 'phc/magma_kernel',
            description: 'A magma kernel for Jupyter, based on bash_kernel',
            technologies: ['Python'],
        },
        {
            html_url: 'https://git.phc.dm.unipi.it/phc/lean4game',
            full_name: 'phc/lean4game',
            description: 'Fork of lean4game with docker support',
            technologies: ['Lean', 'Docker'],
        },
    ]

    const reposById: Record<
        string,
        {
            html_url: string
            full_name: string
            description: string

            topics?: string[]
            stargazers_count?: number
            forks_count?: number
            technologies?: string[]
        }
    > = Object.fromEntries([...githubRepoDetails, ...phcGiteaRepoDetails].map(repo => [repo.full_name, repo]))

    return {
        technologies,
        githubRepoDetails,
        phcGiteaRepoDetails,
        reposById,
    }
}

export type TechnologyDetail = {
    icon: string
    url?: string
    color?: string
}

export async function getTechnology(name: string): Promise<TechnologyDetail> {
    const { technologies } = await getProjectsData()
    return technologies[name]
}

export async function getProject(fullName: string) {
    const { reposById } = await getProjectsData()
    const repo = reposById[fullName]
    if (!repo) {
        throw new Error(`Project ${fullName} not found`)
    }

    return repo
}
