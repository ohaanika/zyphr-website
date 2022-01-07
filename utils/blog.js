import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { bundleMDX } from 'mdx-bundler'
import { remarkMdxImages } from 'remark-mdx-images'

const blogPath = path.join(process.cwd(), 'data', 'blog')

const getAllPostSlugs = () => {
  // get directory names for each post
  return fs
    .readdirSync(blogPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
}

export const getAllPostPaths = () => {
  const allSlugs = getAllPostSlugs()

  // get paths for each post
  return allSlugs.map((slug) => {
    return {
      params: {
        slug,
      },
    }
  })
}

export const getAllPostData = () => {
  const allSlugs = getAllPostSlugs()

  // get data for each post
  const allPosts = allSlugs.map((slug) => {
    // read markdown file as string
    const dirPath = path.join(blogPath, slug)
    const filePath = path.join(dirPath, 'index.mdx')
    const fileContent = fs.readFileSync(filePath, 'utf-8').trim()

    // use gray-matter to parse frontmatter
    const { data } = matter(fileContent)

    return {
      frontmatter: data,
      slug: slug,
      date: data.date,
    }
  })

  // sort posts by date
  return allPosts.sort(({ date: a }, { date: b }) => {
    if (a < b) {
      return 1
    } else if (a > b) {
      return -1
    } else {
      return 0
    }
  })
}

export const getSinglePostData = async (slug) => {
  // read markdown file as string
  const dirPath = path.join(blogPath, slug)
  const filePath = path.join(dirPath, 'index.mdx')
  const fileContent = fs.readFileSync(filePath, 'utf-8').trim()

  // acknowledge remark and rehype plugins
  const remarkPlugins = [remarkMdxImages]
  const rehypePlugins = []

  // ues mdx-bundler to parse code and frontmatter
  const { code, frontmatter } = await bundleMDX({
    source: fileContent,
    cwd: dirPath,
    xdmOptions: (options) => {
      options.remarkPlugins = [...(options.remarkPlugins ?? []), ...remarkPlugins]
      options.rehypePlugins = [...(options.rehypePlugins ?? []), ...rehypePlugins]
      return options
    },
    esbuildOptions: (options) => {
      options.loader = {
        ...options.loader,
        '.png': 'dataurl',
      }
      return options
    },
  })

  return {
    frontmatter,
    code,
  }
}