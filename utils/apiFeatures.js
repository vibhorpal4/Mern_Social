class ApiFeatures {
  constructor(query, queryStr) {
    (this.query = query), (this.queryStr = queryStr);
  }

  search() {
    const keyword = this.queryStr.q
      ? {
          $or: [
            {
              username: {
                $regex: this.queryStr.q,
                $options: "i",
              },
            },
            {
              name: {
                $regex: this.queryStr.q,
                $options: "i",
              },
            },
          ],
        }
      : {};
    this.query = this.query.find({ ...keyword });
    return this;
  }
}

export default ApiFeatures;
