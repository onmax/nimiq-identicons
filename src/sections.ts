import type { Section, Sections } from './types'

const svgModules = {
  bottom: import.meta.glob('/src/svgs/bottom/*.svg', { eager: true, query: '?url', import: 'default' }),
  top: import.meta.glob('/src/svgs/top/*.svg', { eager: true, query: '?url', import: 'default' }),
  face: import.meta.glob('/src/svgs/face/*.svg', { eager: true, query: '?url', import: 'default' }),
  sides: import.meta.glob('/src/svgs/sides/*.svg', { eager: true, query: '?url', import: 'default' }),
} as const

let hasLoaded = false
let identiconFeatures: Record<string, string> = {}

const isIndexedDBSupported = typeof indexedDB !== 'undefined'
let db: IDBDatabase

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported) {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open('identicons-db', 1)

    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('features')
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getFromDB(db: IDBDatabase, key: string): Promise<Record<string, string> | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('features', 'readonly')
    const store = transaction.objectStore('features')
    const request = store.get(key)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function putInDB(db: IDBDatabase, key: string, value: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('features', 'readwrite')
    const store = transaction.objectStore('features')
    const request = store.put(value, key)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getIdenticonsFeatures(): Promise<Record<string, string>> {
  if (hasLoaded)
    return identiconFeatures

  if (isIndexedDBSupported) {
    db = db || await openDB()
    const cachedFeatures = await getFromDB(db, 'identicons')
    if (cachedFeatures) {
      identiconFeatures = cachedFeatures
      hasLoaded = true
      return identiconFeatures
    }
  }

  const fetchPromises = Object.entries(svgModules).flatMap(([_section, paths]) =>
    Object.keys(paths).map(path =>
      fetch(paths[path] as string)
        .then(response => response.text())
        .then((svg) => { identiconFeatures[path] = svg }),
    ),
  )

  await Promise.all(fetchPromises)

  if (db && isIndexedDBSupported)
    await putInDB(db, 'identicons', identiconFeatures)
  hasLoaded = true
  return identiconFeatures
}

async function sectionToSvg(section: Section, index: number): Promise<string> {
  const numIndex = (Number(index) % 21) + 1
  const assetIndex = numIndex < 10 ? `0${numIndex}` : `${numIndex}`
  const selector = `${section}_${assetIndex}`
  const svgFile = `/src/svgs/${section}/${selector}.svg`

  const features = await getIdenticonsFeatures()
  const cachedSvg = features[svgFile]
  if (!cachedSvg) {
    console.error(`SVG file not found for ${section} with index ${numIndex}/${index}. Path ${svgFile}`)
    throw new Error(`SVG file not found for ${section} with index ${index}`)
  }
  return cachedSvg
}

export async function sectionsToSvg(sectionsIndexes: Record<Section, number>): Promise<Sections> {
  const [bottom, face, sides, top] = await Promise.all(
    (['bottom', 'face', 'sides', 'top'] as Section[]).map(s => sectionToSvg(s, sectionsIndexes[s])),
  )
  return { bottom, top, sides, face }
}
