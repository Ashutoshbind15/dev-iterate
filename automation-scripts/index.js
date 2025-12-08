import Parser from "rss-parser";
let parser = new Parser();

const fetcher = async (url, limit = 10) => {
  const feed = await parser.parseURL(url);

  return {
    title: feed.title,
    items: feed.items.slice(0, limit).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      content: item.content,
    })),
  };
};
