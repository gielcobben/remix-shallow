import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  CSSProperties,
  MouseEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn, getPage, getPosts, Post, useResponsiveLanes } from "~/utils";

export const LIMIT = 50;
export const OVERSCAN = 25;

export async function loader({ request }: LoaderFunctionArgs) {
  const { page } = getPage(new URL(request.url).searchParams);
  const { posts, total } = await getPosts({ page, limit: LIMIT });

  return json(
    {
      total,
      items: posts,
      url: request.url,
    },
    { headers: { "Cache-Control": "public, max-age=120" } }
  );
}

export default function Index() {
  const { items } = useLoaderData<typeof loader>();

  const lanes = useResponsiveLanes();
  const gridRef = useRef<HTMLDivElement>(null);
  const [post, setPost] = useState<Post | null>(null);

  const hiddenStyle: CSSProperties = {
    width: 640,
    left: "-9999px",
    position: "fixed",
    visibility: "hidden",
    pointerEvents: "none",
  };

  const rowVirtualizer = useWindowVirtualizer({
    lanes,
    overscan: 25,
    count: items.length,
    estimateSize: useCallback(() => 300, []),
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  const openPost = useCallback(
    (event: MouseEvent, item: Post) => {
      event.preventDefault();

      const measurementsCache = rowVirtualizer.measurementsCache;
      const offset = rowVirtualizer.scrollOffset;

      sessionStorage.setItem(
        "scroll-settings",
        JSON.stringify({ offset, measurementsCache })
      );

      // If you comment this out, it works.
      // history.pushState(null, "", `/posts/${item.id}`);

      setPost(item);

      window.scrollTo(0, 0);
    },
    [rowVirtualizer.measurementsCache, rowVirtualizer.scrollOffset, setPost]
  );

  useLayoutEffect(() => {
    if (!post) {
      const scrollSettings = sessionStorage.getItem("scroll-settings");

      if (scrollSettings) {
        const { offset, measurementsCache } = JSON.parse(scrollSettings);

        console.log(`scrolling to offset ${offset}`);

        rowVirtualizer.measurementsCache = measurementsCache;
        rowVirtualizer.scrollToOffset(offset);
      }
    }
  }, [post, rowVirtualizer]);

  useLayoutEffect(() => {
    function handlePopState() {
      setPost(null);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="font-sans p-4">
      <div style={post ? hiddenStyle : undefined}>
        <div
          ref={gridRef}
          data-hydrating-signal
          className={cn("relative mx-auto w-full")}
        >
          <div
            style={{
              width: "100%",
              position: "relative",
              height: rowVirtualizer.getTotalSize(),
            }}
          >
            {virtualItems.map((virtualRow) => {
              const index = virtualRow.index;
              const item = items[index];

              return (
                <div
                  key={virtualRow.key}
                  className="p-4"
                  style={{
                    position: "absolute",
                    top: 0,
                    width: `${100 / lanes}%`,
                    left: `${(virtualRow.lane * 100) / lanes}%`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  data-index={virtualRow.index}
                  ref={virtualRow.measureElement}
                >
                  {item ? <GridItem item={item} setPost={openPost} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <article
        style={post ? undefined : hiddenStyle}
        className="flex items-center justify-center min-h-[calc(100dvh-200px)]"
      >
        <button onClick={() => setPost(null)}>Back</button>
      </article>
    </div>
  );
}

function GridItem({
  item,
  setPost,
}: {
  item: Post;
  setPost: (event: MouseEvent, item: Post) => void;
}) {
  return (
    <article
      style={{ height: item.height, backgroundColor: item.backgroundColor }}
    >
      <Link
        onClick={(event) => setPost(event, item)}
        to={`/posts/${item.id}`}
        className="rounded-xl"
      >
        {item.title}
      </Link>
    </article>
  );
}
