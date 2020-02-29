const express = require("express");
const { ApolloServer, PubSub } = require("apollo-server-express");
const fs = require("fs");
const path = require("path");
const { createServer } = require("http");

// 获取 mock 数据
const { students, photos } = require("./db");

// 获取预先定义的 graphql 类型
const typeDefs = fs.readFileSync(path.join(__dirname, "./typeDefs.graphql"), {
  encoding: "utf-8"
});

const pubsub = new PubSub();

// 匹配处理方法
const resolvers = {
  Query: {
    // 第一个参数为父查询集，因为可能是在嵌套调用
    // 第二个参数为查询集传的参数
    // 第三个参数是在初始化 ApolloServer 时注入的对象
    allStudents: (parent, args, yy) => {
      return students;
    },
    allPhotos: () => {
      return photos;
    }
  },
  Mutation: {
    // 第一个参数为父查询集，因为可能是在嵌套调用
    // 第二个参数为查询集传的参数
    // 第三个参数是在初始化 ApolloServer 时注入的对象
    postPhoto: async (parent, args, { pubsub }) => {
      await Promise.resolve();
      pubsub.publish("photo-add", { newPhoto: photos[0] });
      return photos[0];
    }
  },
  Subscription: {
    newPhoto: {
      subscribe: (parent, args, { pubsub }) => {
        return pubsub.asyncIterator("photo-add");
      }
    }
  },
  Student: {
    isGood: parent => {
      return parent.grade > 90;
    }
  },
  Photo: {
    postedBy: photo => {
      return students.find(item => item.id === photo.postedBy);
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // 注入自定义对象
  context: {
    hello: "123",
    pubsub
  }
});

const app = express();
const httpServer = createServer(app);

server.installSubscriptionHandlers(httpServer);

server.applyMiddleware({ app });

httpServer.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
